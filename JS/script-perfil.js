document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN Y REFERENCIAS ---
    const API_URL = 'http://localhost:3000/api/user';
    // En una aplicación real, obtendrías el ID del usuario después del login (p.ej., desde localStorage)
    const currentUserId = 1; 

    const profilePicture = document.getElementById('profilePicture');
    const changeProfilePicBtn = document.getElementById('changeProfilePicBtn');
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePicActions = document.getElementById('profilePicActions');
    const saveProfilePicBtn = document.getElementById('saveProfilePicBtn');
    const cancelProfilePicBtn = document.getElementById('cancelProfilePicBtn');
    
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileForm = document.getElementById('profileForm');
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const passwordForm = document.getElementById('passwordForm');
    
    const editableInputs = [
        // document.getElementById('userName'),
        document.getElementById('name'),
        document.getElementById('lastName')
    ];

    let originalUserData = {}; // Para guardar los datos originales y poder cancelar

    // --- FUNCIÓN PARA CONVERTIR BUFFER A IMAGEN ---
    // La data 'varbinary' llega como un objeto Buffer en el JSON. Hay que convertirla.
    const bufferToImage = (bufferData) => {
        if (!bufferData || !bufferData.data) {
            return '../images/default-avatar.png'; // Imagen por defecto si no hay foto
        }
        const base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(bufferData.data)));
        return `data:image/png;base64,${base64String}`;
    };

    // --- CARGAR DATOS DEL USUARIO AL INICIAR ---
    const loadUserProfile = async () => {
        try {
            const response = await fetch(`${API_URL}/profile/${currentUserId}`);
            if (!response.ok) throw new Error('Usuario no encontrado');
            
            const user = await response.json();
            originalUserData = { ...user, foto: bufferToImage(user.foto) }; // Guardar estado original
            
            document.getElementById('userName').value = user.userName;
            document.getElementById('name').value = user.name;
            document.getElementById('lastName').value = user.lastName;
            profilePicture.src = originalUserData.foto;

        } catch (error) {
            console.error('Error al cargar el perfil:', error);
            alert('No se pudo cargar la información del perfil.');
        }
    };

    // --- MODO EDICIÓN DE INFORMACIÓN PERSONAL ---
    editProfileBtn.addEventListener('click', () => {
        const isEditMode = !editableInputs[0].disabled;
        if (isEditMode) {
            // Cancelar edición
            editProfileBtn.innerHTML = "<i class='bx bxs-edit'></i> Editar";
            saveChangesBtn.style.display = 'none';
            editableInputs.forEach(input => input.disabled = true);
            // Restaurar valores originales
            // document.getElementById('userName').value = originalUserData.userName;
            document.getElementById('name').value = originalUserData.name;
            document.getElementById('lastName').value = originalUserData.lastName;
        } else {
            // Habilitar edición
            editProfileBtn.innerHTML = "<i class='bx bx-x'></i> Cancelar";
            saveChangesBtn.style.display = 'inline-block';
            editableInputs.forEach(input => input.disabled = false);
            editableInputs[0].focus();
        }
    });

    // --- GUARDAR CAMBIOS DEL PERFIL PERSONAL ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            // userName: document.getElementById('userName').value,
            name: document.getElementById('name').value,
            lastName: document.getElementById('lastName').value,
        };

        try {
            const response = await fetch(`${API_URL}/profile/${currentUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) throw new Error('Error al actualizar');
            
            alert('Perfil actualizado con éxito');
            loadUserProfile(); // Recargar datos para confirmar
            editProfileBtn.click(); // Salir del modo edición
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            alert('No se pudo guardar la información.');
        }
    });

    // --- GESTIÓN DE LA FOTO DE PERFIL ---
    changeProfilePicBtn.addEventListener('click', () => profilePicInput.click());

    profilePicInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePicture.src = e.target.result; // Previsualizar
                profilePicActions.style.display = 'block';
                changeProfilePicBtn.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    cancelProfilePicBtn.addEventListener('click', () => {
        profilePicture.src = originalUserData.foto; // Restaurar foto original
        profilePicInput.value = '';
        profilePicActions.style.display = 'none';
        changeProfilePicBtn.style.display = 'inline-flex';
    });

    saveProfilePicBtn.addEventListener('click', async () => {
        const fotoBase64 = profilePicture.src;
        try {
            const response = await fetch(`${API_URL}/photo/${currentUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto: fotoBase64 })
            });
            if (!response.ok) throw new Error('Error al guardar la foto');

            alert('Foto de perfil actualizada');
            await loadUserProfile(); // Recargar datos, incluyendo la nueva foto desde la DB
            cancelProfilePicBtn.click(); // Restablecer UI
        } catch (error) {
            console.error('Error al guardar foto:', error);
            alert('No se pudo guardar la foto de perfil.');
        }
    });

    // --- CAMBIAR CONTRASEÑA ---
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            return alert('La nueva contraseña y su confirmación no coinciden.');
        }
        
        try {
            const response = await fetch(`${API_URL}/password/${currentUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            alert('Contraseña actualizada correctamente.');
            passwordForm.reset();
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // --- INICIALIZACIÓN ---
    loadUserProfile();
});
const signupForm = document.querySelector('#signupform');
if (signupForm) {
    signupForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this);

        fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password')
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Signup failed');
                }
                return response.json();
            })
            .then(data => {
                console.log('Signup successful:', data);
            })
            .catch(error => {
                console.error('Error signing up:', error);
            });
    });
}

const loginForm = document.querySelector('#loginform');
if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this);
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        console.log('Attempting to login with data:', loginData);

        fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password')
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                console.log('Fetch response', response)
                if (!response.ok) {
                    throw new Error('Login failed');
                }
                return response.json();
            })
            .then(data => {
                console.log('Login successful:', data);
                const userId = data.user_id;
                localStorage.setItem('user_id', userId);
                console.log('User logged in. user_id:', userId);
                window.location.href = 'index.html';
            })
            .catch(error => {
                console.error('Error logging in:', error);
            });
    });
}
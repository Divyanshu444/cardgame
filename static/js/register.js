const usernameInput = document.querySelector('.name[name="username"]');
const emailInput = document.querySelector('.name[name="email"]');
const countrySelect = document.querySelector('.form-select[name="country"]');
const submitBtn = document.getElementById('submit');
const span = document.querySelector('.span');

submitBtn.addEventListener('click', sendData);

function sendData() {
    // Check if any input field is blank
    if (usernameInput.value.trim() === '' || emailInput.value.trim() === '' || countrySelect.value.trim() === '') {
        alert('Please fill in all fields');
        return;
    }

    // Check if the username is less than 3 characters
    if (usernameInput.value.trim().length < 3) {
        span.innerHTML = ('Username must be at least 3 characters long and no more than 8 characters.');
        return;
    }

    const data = {
        username: usernameInput.value,
        email: emailInput.value,
        country: countrySelect.value
    };

    fetch('/registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(jsonData => {
        // Handle the JSON response from the server
        console.log('Server response:', jsonData);
        if (jsonData.msg === true) {
            window.location.href = '/';
        } else {
            span.innerHTML = 'Username or Email Already exist.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

document.getElementById('login').addEventListener('click', () => {
    window.location.href = '/login';
});

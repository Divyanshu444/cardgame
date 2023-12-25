document.getElementById('submit').addEventListener('click', function () {
    // Get values from inputs
    var username = document.getElementById('username').value.trim();
    var email = document.getElementById('email').value.trim();

    // Validate username and email
    var nameError = document.getElementById('name-err');
    var emailError = document.getElementById('email-err');

    nameError.textContent = '';
    emailError.textContent = '';

    if (username === '') {
        nameError.textContent = 'Username cannot be empty';
        return;
    }

    if (username.length < 3) {
        nameError.textContent = 'Username should be at least 3 characters';
        return;
    }

    if (email === '') {
        emailError.textContent = 'Email cannot be empty';
        return;
    }

    // Prepare data for sending to the server
    var data = {
        username: username,
        email: email
    };

    // Make a POST request to the server
    fetch('/loginToServer', {
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
        if (jsonData.msg == true) {
            window.location.href = '/';
        } else {
            document.getElementById('err').innerHTML = 'Invalid Credentials';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    load_mailbox('inbox');

    document.querySelector('#compose-form').onsubmit = function() {
        send_mail();
        return false;
    };
});

function compose_email() {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function send_mail() {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    const payload = JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
    });

    console.log('Sending payload:', payload);

    fetch('/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.csrfToken
            },
            body: payload
        })
        .then(response => response.json())
        .then(result => {
            console.log('Success:', result);
            load_mailbox('sent');
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function load_mailbox(mailbox) {
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach(email => {
                const email_div = document.createElement('div');
                email_div.className = 'email';
                email_div.innerHTML = `<b>${email.sender}</b> ${email.subject} - ${email.timestamp}`;
                email_div.addEventListener('click', () => view_email(email.id));
                document.querySelector('#emails-view').append(email_div);
            });
        });
}

function view_email(email_id) {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

    fetch(`/emails/${email_id}`)
        .then(response => response.json())
        .then(email => {
            document.querySelector('#email-view').innerHTML = `
        <ul>
          <li><b>From:</b> ${email.sender}</li>
          <li><b>To:</b> ${email.recipients.join(', ')}</li>
          <li><b>Subject:</b> ${email.subject}</li>
          <li><b>Timestamp:</b> ${email.timestamp}</li>
        </ul>
        <hr>
        <p>${email.body}</p>
        <button id="reply">Reply</button>
        <button id="archive">${email.archived ? 'Unarchive' : 'Archive'}</button>
      `;

            document.querySelector('#reply').addEventListener('click', () => {
                compose_email();
                document.querySelector('#compose-recipients').value = email.sender;
                document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
                document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
            });

            document.querySelector('#archive').addEventListener('click', () => {
                if (email.archived) {
                    unarchive(email.id);
                } else {
                    archive(email.id);
                }
            });
        });
}


function archiveEmail(emailId) {
    fetch(`/emails/${emailId}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            }),
            headers: {
                'X-CSRFToken': window.csrfToken,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                load_mailbox('inbox');
            } else {
                console.error('Failed to archive email.');
            }
        })
        .catch(error => {
            console.error('Error archiving email:', error);
        });
}

function unarchiveEmail(emailId) {
    fetch(`/emails/${emailId}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            }),
            headers: {
                'X-CSRFToken': window.csrfToken,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                load_mailbox('inbox');
            } else {
                console.error('Failed to unarchive email.');
            }
        })
        .catch(error => {
            console.error('Error unarchiving email:', error);
        });
}

document.querySelector('#archive-email').addEventListener('click', () => {
    const emailId = document.querySelector('#email-id').textContent;
    archiveEmail(emailId);
});

document.querySelector('#unarchive-email').addEventListener('click', () => {
    const emailId = document.querySelector('#email-id').textContent;
    unarchiveEmail(emailId);
});
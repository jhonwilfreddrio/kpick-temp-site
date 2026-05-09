document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.contact-form');

    if (!form) {
        return;
    }

    const status = form.querySelector('.contact-form__status');
    const submitButton = form.querySelector('.contact-form__button');
    const defaultButtonText = submitButton ? submitButton.textContent : 'Send';

    const setStatus = (message, type) => {
        if (!status) {
            return;
        }

        status.textContent = message;
        status.classList.remove('is-success', 'is-error');

        if (type) {
            status.classList.add(`is-${type}`);
        }
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            setStatus('Please complete the required fields before sending.', 'error');
            return;
        }

        const formData = new FormData(form);
        setStatus('Sending your message...', null);

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
        }

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json'
                }
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Unable to send message.');
            }

            form.reset();
            setStatus('Message sent. We will get back to you soon.', 'success');
        } catch (error) {
            setStatus('Message could not be sent. Please try again or email us directly.', 'error');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = defaultButtonText;
            }
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.contact-form');

    if (!form) {
        return;
    }

    const status = form.querySelector('.contact-form__status');
    const submitButton = form.querySelector('.contact-form__button');
    const defaultButtonText = submitButton ? submitButton.textContent : 'Send';

    const setStatus = (message, type, html) => {
        if (!status) {
            return;
        }

        if (html) {
            status.innerHTML = message;
        } else {
            status.textContent = message;
        }
        status.classList.remove('is-success', 'is-error');

        if (type) {
            status.classList.add(`is-${type}`);
        }
    };

    const CONTACT_TIMEOUT_MS = 8000; // SMX congested wifi budget

    let isSending = false;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (isSending) {
            return; // guard against double-submit while in flight
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            setStatus('Please complete the required fields before sending.', 'error');
            return;
        }

        const formData = new FormData(form);
        setStatus('Sending your message...', null);

        isSending = true;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending…';
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CONTACT_TIMEOUT_MS);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json'
                },
                signal: controller.signal
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Unable to send message.');
            }

            form.reset();
            setStatus('Message sent &mdash; K-Pick will get back to you within 1 business day. Urgent? Call or text <a href="tel:+639173158420">+63 917 315 8420</a>.', 'success', true);
        } catch (error) {
            if (error instanceof TypeError || error?.name === 'AbortError') {
                setStatus('Message could not be sent &mdash; the connection is too slow or unavailable. Please try again, or call or text <a href="tel:+639173158420">+63 917 315 8420</a>.', 'error', true);
            } else {
                setStatus('Message could not be sent. Please try again or email us directly.', 'error');
            }
        } finally {
            clearTimeout(timer);
            isSending = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = defaultButtonText;
            }
        }
    });
});

class ModalManager {
    constructor() {
        this.modalContainer = document.getElementById('modal-container');
        this.backdrop = document.getElementById('modal-backdrop');
        this.activeModal = null;
        this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

        this.backdrop.addEventListener('click', () => this.hide());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.hide();
            }
            if (e.key === 'Tab' && this.activeModal) {
                this.trapFocus(e);
            }
        });
    }

    create(id, title, content, footerButtons = []) {
        const existingModal = document.getElementById(`modal-${id}`);
        if(existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = `modal-${id}`;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `modal-title-${id}`);

        let footerHTML = '';
        if (footerButtons.length > 0) {
            footerHTML = `<div class="modal-footer">${footerButtons.map(btn => `<button type="button" id="${btn.id}" class="btn ${btn.class}">${btn.text}</button>`).join('')}</div>`;
        }

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modal-title-${id}">${title}</h5>
                        <button type="button" class="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${footerHTML}
                </div>
            </div>
        `;
        
        this.modalContainer.appendChild(modal);

        return modal;
    }

    show(id, onShow) {
        if (this.activeModal) this.hide();
        
        const modal = document.getElementById(`modal-${id}`);
        if (!modal) return;

        this.activeModal = modal;
        this.backdrop.classList.remove('hidden');
        this.activeModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const firstFocusable = this.activeModal.querySelectorAll(this.focusableElements)[0];
        if (firstFocusable) {
            firstFocusable.focus();
        }

        if (typeof onShow === 'function') {
            onShow(this.activeModal);
        }
    }

    hide() {
        if (!this.activeModal) return;
        this.backdrop.classList.add('hidden');
        this.activeModal.classList.remove('active');
        this.activeModal = null;
        document.body.style.overflow = '';
    }

    trapFocus(e) {
        const focusableContent = this.activeModal.querySelectorAll(this.focusableElements);
        if (focusableContent.length === 0) return;
        
        const firstFocusable = focusableContent[0];
        const lastFocusable = focusableContent[focusableContent.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
            }
        }
    }
    
    destroy(id) {
        const modal = document.getElementById(`modal-${id}`);
        if (modal) {
            modal.remove();
        }
    }

    destroyAll() {
        this.modalContainer.innerHTML = '';
    }
}
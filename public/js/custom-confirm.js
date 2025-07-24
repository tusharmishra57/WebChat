/* 🚨 CUSTOM CONFIRMATION DIALOG */

class CustomConfirm {
    constructor() {
        this.createConfirmModal();
    }

    createConfirmModal() {
        // Remove existing modal if any
        const existing = document.getElementById('custom-confirm-modal');
        if (existing) existing.remove();

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'custom-confirm-modal';
        modal.className = 'custom-confirm-modal hidden';
        modal.innerHTML = `
            <div class="confirm-overlay"></div>
            <div class="confirm-content">
                <div class="confirm-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="confirm-title" id="confirm-title">Confirm Action</div>
                <div class="confirm-message" id="confirm-message">Are you sure?</div>
                <div class="confirm-buttons">
                    <button class="confirm-btn cancel-btn" id="confirm-cancel">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                    <button class="confirm-btn delete-btn" id="confirm-delete">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
    }

    show(title, message, confirmText = 'Confirm') {
        return new Promise((resolve) => {
            const titleEl = document.getElementById('confirm-title');
            const messageEl = document.getElementById('confirm-message');
            const deleteBtn = document.getElementById('confirm-delete');
            const cancelBtn = document.getElementById('confirm-cancel');

            titleEl.textContent = title;
            messageEl.textContent = message;
            deleteBtn.innerHTML = `<i class="fas fa-trash"></i> ${confirmText}`;

            // Show modal
            this.modal.classList.remove('hidden');
            this.modal.classList.add('visible');

            // Handle buttons
            const handleConfirm = () => {
                this.hide();
                resolve(true);
                cleanup();
            };

            const handleCancel = () => {
                this.hide();
                resolve(false);
                cleanup();
            };

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            };

            const cleanup = () => {
                deleteBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                document.removeEventListener('keydown', handleEscape);
            };

            deleteBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            document.addEventListener('keydown', handleEscape);

            // Focus on cancel button by default
            setTimeout(() => cancelBtn.focus(), 100);
        });
    }

    hide() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('visible');
    }
}

// Create global instance
window.customConfirm = new CustomConfirm();

// Add CSS styles
const confirmStyles = document.createElement('style');
confirmStyles.textContent = `
/* Custom Confirm Modal */
.custom-confirm-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.custom-confirm-modal.visible {
    opacity: 1;
    visibility: visible;
}

.custom-confirm-modal.hidden {
    opacity: 0;
    visibility: hidden;
}

.confirm-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
}

.confirm-content {
    position: relative;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 32px;
    max-width: 400px;
    width: calc(100% - 40px);
    text-align: center;
    box-shadow: var(--shadow-lg);
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.custom-confirm-modal.visible .confirm-content {
    transform: scale(1);
}

.confirm-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    animation: pulse 2s infinite;
}

.confirm-icon i {
    color: white;
    font-size: 28px;
}

.confirm-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
}

.confirm-message {
    font-size: 1rem;
    color: var(--text-muted);
    margin-bottom: 32px;
    line-height: 1.5;
}

.confirm-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
}

.confirm-btn {
    padding: 12px 24px;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    min-width: 120px;
    justify-content: center;
}

.cancel-btn {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border: 1px solid var(--glass-border);
}

.cancel-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

.delete-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
}

.delete-btn:hover {
    background: linear-gradient(135deg, #ee5a24, #ff6b6b);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(238, 90, 36, 0.3);
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

@media (max-width: 480px) {
    .confirm-content {
        padding: 24px;
        margin: 20px;
    }
    
    .confirm-buttons {
        flex-direction: column;
    }
    
    .confirm-btn {
        width: 100%;
    }
}
`;

document.head.appendChild(confirmStyles);
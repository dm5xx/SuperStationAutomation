class DraggableOverlay {
    constructor() {
        this.overlay = document.getElementById('overlay');
        this.header = document.getElementById('overlay-header');
        this.messageList = document.getElementById('message-list');

        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;

        this.addEventListeners();
    }

    addEventListeners() {
        this.header.addEventListener('mousedown', this.dragStart.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.dragEnd.bind(this));
    }

    dragStart(e) {
        this.initialX = e.clientX - this.overlay.offsetLeft;
        this.initialY = e.clientY - this.overlay.offsetTop;
        this.isDragging = true;
    }

    drag(e) {
        if (this.isDragging) {
            e.preventDefault();
            this.currentX = e.clientX - this.initialX;
            this.currentY = e.clientY - this.initialY;
            this.overlay.style.left = `${this.currentX}px`;
            this.overlay.style.top = `${this.currentY}px`;
        }
    }

    dragEnd() {
        this.isDragging = false;
    }

    addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        const date = new Date();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        
        messageElement.textContent = message + " at " + hours + ":"+ minutes;

        if(this.messageList.childElementCount > 10)
        {
            this.messageList.removeChild(this.messageList.lastElementChild);
        }

        this.messageList.insertBefore(messageElement, this.messageList.firstChild);
    }

    clear()
    {
        while (this.messageList.firstChild) {
            this.messageList.removeChild(this.messageList.lastChild);
        }
    }
}
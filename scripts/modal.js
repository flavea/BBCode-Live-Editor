const modal = {
    modals: document.querySelectorAll('.modal'),
    open: function(id) {
        document.getElementById(id).style.display = "flex"
    },
    close: function() {
        modal.modals.forEach(el => el.style.display = "none")
    }
}
document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname.split("/").pop();
    const sidebarLinks = document.querySelectorAll(".sidebar ul li a");

    sidebarLinks.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.parentElement.classList.add("active");
        }
    });
});

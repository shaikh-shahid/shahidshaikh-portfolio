document.addEventListener("DOMContentLoaded", () => {
  const navigation = document.querySelector(".site-navigation");
  const button = navigation?.querySelector(".navigation-menu-button");

  if (!navigation || !button) return;

  button.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
});

// Workforce Solutions website
const WHATSAPP_NUMBER = "918609955837";

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", isOpen);
});

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

function openWhatsApp(message){
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

document.getElementById("whatsappFloat").addEventListener("click", (e) => {
  e.preventDefault();
  openWhatsApp("Hello Workforce Solutions, I would like to know more about your services.");
});

document.getElementById("employerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = `Hello Workforce Solutions,\n\nI would like to share a manpower requirement.\n\nName: ${document.getElementById("eName").value}\nCompany: ${document.getElementById("eCompany").value}\nPhone: ${document.getElementById("ePhone").value}\nWork Location: ${document.getElementById("eLocation").value}\nManpower Required: ${document.getElementById("eCount").value}\nCategory: ${document.getElementById("eCategory").value}\nDetails: ${document.getElementById("eDetails").value || "Not provided"}\n\nPlease contact me regarding this requirement.`;
  openWhatsApp(message);
});

document.getElementById("candidateForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = `Hello Workforce Solutions,\n\nI would like to register as a job candidate.\n\nName: ${document.getElementById("cName").value}\nPhone: ${document.getElementById("cPhone").value}\nLocation: ${document.getElementById("cLocation").value}\nPreferred Job: ${document.getElementById("cJob").value}\nExperience / Skills: ${document.getElementById("cExperience").value || "Not provided"}\n\nPlease contact me if there is a suitable job opportunity.`;
  openWhatsApp(message);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
const WHATSAPP_NUMBER = "918609955837";

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle?.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("#navMenu a").forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

document.getElementById("whatsappFloat")?.addEventListener("click", (event) => {
  event.preventDefault();
  openWhatsApp("Hello Workforce Solutions, I would like to know more about your manpower and recruitment services.");
});

document.getElementById("employerForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = `Hello Workforce Solutions,

I have a manpower requirement.

EMPLOYER DETAILS
Name: ${document.getElementById("eName").value}
Company: ${document.getElementById("eCompany").value}
Phone: ${document.getElementById("ePhone").value}
Work Location: ${document.getElementById("eLocation").value}

REQUIREMENT
Role / Designation: ${document.getElementById("eRole").value}
Manpower Required: ${document.getElementById("eCount").value}
Employment Type: ${document.getElementById("eType").value}
Industry: ${document.getElementById("eCategory").value}
Salary / Budget: ${document.getElementById("eSalary").value || "Not specified"}
Required By: ${document.getElementById("eTimeline").value || "Not specified"}
Additional Details: ${document.getElementById("eDetails").value || "Not specified"}

Please contact me regarding this requirement.`;

  openWhatsApp(message);
});

document.getElementById("candidateForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = `Hello Workforce Solutions,

I would like to register for job opportunities.

CANDIDATE PROFILE
Name: ${document.getElementById("cName").value}
Phone: ${document.getElementById("cPhone").value}
Current Location: ${document.getElementById("cLocation").value}
Qualification: ${document.getElementById("cQualification").value || "Not specified"}
Preferred Job: ${document.getElementById("cJob").value}
Experience: ${document.getElementById("cExperience").value || "Not specified"}
Skills / Previous Work: ${document.getElementById("cSkills").value || "Not specified"}

I understand that registration does not guarantee placement.`;

  openWhatsApp(message);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

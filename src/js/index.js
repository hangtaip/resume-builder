import "../components/userPic/userPic.js";
import "../components/details/details.js";
import "../components/skills/skills.js";
import "../components/educations/educations.js";
import "../components/experiences/experiences.js";
import "../components/menuBtn/menuBtn.js";
// import "../components/printBtn/printBtn.js";
// import "../components/homeForm/homeForm.js";
import "../components/formPersonal/formPersonal.js";
import "../components/formEducation/formEducation.js";
import "../components/formSkills/formSkills.js";
import "../components/formExperience/formExperience.js";
import "../components/customNav/customNav.js";
import "../components/customAside/customAside.js";
import "../components/customInput/customInput.js";
import "../components/customTextarea/customTextarea.js";
import "../components/previewResume/previewResume.js";
import "../components/loadingScreen/loadingScreen.js";
import "../components/loadingBlock/loadingBlock.js";
import "../pages/home/home.js";
import "../pages/home/resume_default/resume_default.js";
import "../pages/home/resume_classic/resume_classic.js";
import "../css/index.scss";
import { registry } from "./functionRegistry.js";

window.appRegistry = registry;

const home = document.createElement("resume-home");

document.body.appendChild(home);

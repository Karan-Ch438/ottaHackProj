console.info('my script is running');
const body = document.querySelector("body");

if (body) {
  const div = document.createElement("div");
  div.style.width = "100px";
  div.style.height = "100px";
  div.style.background = "white";
  div.style.position = "fixed";
  div.style.top = "50%";
  div.style.left = "50%";
  div.style.transform = "translate(-50%, -50%)";
  div.style.textAlign = "center";
  div.style.lineHeight = "100px";
  div.textContent = "hi";
  body.appendChild(div);
}

inputText = [];
current_pointer = 0;

function input(e) {
  if (e.keyCode === 13) {
    const val = e.target.value.trim();
    if (val != "") {
      e.target.value = "";
      let text = document.createElement("p");
      text.innerText = val;
      document.getElementById("terminal").appendChild(text);
  
      inputText.unshift(val);
      current_pointer = -1;
    }
  }
  else if (e.keyCode === 38) {
    if (current_pointer >= (inputText.length - 1)) {
      return;
    }
    current_pointer += 1;
    e.target.value = inputText[current_pointer];
  }
  else if (e.keyCode === 40) {
    if (current_pointer <= 0) {
      e.target.value = "";
      current_pointer = -1;
    }
    else {
      current_pointer -= 1;
      e.target.value = inputText[current_pointer];
    }
  }
}

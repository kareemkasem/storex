const deleteParent = (btn, url) => {
  const id = btn.parentNode.querySelector("#id").value;
  const csrfToken = btn.parentNode.querySelector("[name=_csrf]").value;

  fetch(`${url}/${id}`, {
    method: "DELETE",
    headers: {
      "csrf-token": csrfToken,
    },
  })
    .then(() => {
      btn.parentNode.closest("#parent").remove();
    })
    .catch((err) => {
      document.getElementById("delete-error").style.display = "block";
    });
};

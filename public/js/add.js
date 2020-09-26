const add = async (btn, url) => {
  const id = btn.parentNode.querySelector("#id").value || null;
  const csrfToken = btn.parentNode.querySelector("[name=_csrf]").value;
  const originaText = btn.innerText;

  try {
    btn.style.color = "#fff";
    btn.style.background = "#00695c";
    btn.innerText = "adding ...";

    await fetch(id ? `${url}/${id}` : url, {
      headers: {
        "csrf-token": csrfToken,
      },
      method: "POST",
    });

    btn.innerText = "added ✅";

    setTimeout(() => {
      btn.innerText = originaText;
      btn.style.background = "#fff";
      btn.style.color = "#00695c";
    }, 1000);
  } catch (err) {
    document.querySelector("#add-error").style.display = block;
  }
};

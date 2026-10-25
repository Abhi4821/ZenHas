"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("blockedUsersList");
  const status = document.getElementById("blockListStatus");

  if (!list || !window.AudioUtils) {
    console.error("Blocked users list or AudioUtils is missing.");
    return;
  }

  function render() {
    // const blockedIds = window.AudioUtils.getBlockedIds();
    const blockedIds = window.AudioUtils.getBlockedUserIds();
    list.replaceChildren();

    if (status) {
      status.textContent = `${blockedIds.length} blocked user(s)`;
    }

    if (blockedIds.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";

      const heading = document.createElement("h3");
      heading.textContent = "Your Block List is empty";

      const description = document.createElement("p");
      description.textContent =
        "Dashboard par kisi user ko Remove karne se woh yahan aayega.";

      emptyState.append(heading, description);
      list.appendChild(emptyState);
      return;
    }

    blockedIds.forEach((userId) => {
      const card = document.createElement("article");
      card.className = "queue-card";

      const avatar = document.createElement("div");
      avatar.className = "avatar";

      const avatarText = document.createElement("span");
      avatarText.textContent = "U";
      avatar.appendChild(avatarText);

      const userInfo = document.createElement("div");
      userInfo.className = "user-info";

      const heading = document.createElement("h3");
      heading.textContent = "Blocked user";

      const idText = document.createElement("p");
      idText.className = "user-id";
      idText.textContent = String(userId);

      userInfo.append(heading, idText);

      const actions = document.createElement("div");
      actions.className = "card-actions";

      const unblockButton = document.createElement("button");
      unblockButton.type = "button";
      unblockButton.className = "btn btn-primary unblock-btn";
      unblockButton.textContent = "Unblock";
      unblockButton.dataset.userId = String(userId);

      actions.appendChild(unblockButton);
      card.append(avatar, userInfo, actions);
      list.appendChild(card);
    });
  }

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".unblock-btn");

    if (!button || !list.contains(button)) return;

    const userId = button.dataset.userId;
    if (!userId) return;

    button.disabled = true;

    try {
      window.AudioUtils.unblockUser(userId);
      render();
    } catch (error) {
      console.error("Failed to unblock user:", error);
      button.disabled = false;

      if (status) {
        status.textContent = "Unable to unblock user. Please try again.";
      }
    }
  });

  render();
});

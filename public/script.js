const API = "/";
let token = localStorage.getItem("token") || null;
let currentOrgId = null;
let currentBoardId = null;
let organizations = [];

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function showPage(page) {
    document.getElementById("page-auth").style.display = page === "auth" ? "flex" : "none";
    document.getElementById("page-dashboard").style.display = page === "dashboard" ? "block" : "none";
}

function switchTab(tab) {
    $$(".tab").forEach(t => t.classList.remove("active"));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add("active");
    document.getElementById("form-signin").style.display = tab === "signin" ? "flex" : "none";
    document.getElementById("form-signup").style.display = tab === "signup" ? "flex" : "none";
}

async function api(method, path, body) {
    const opts = {
        method,
        headers: { "Content-Type": "application/json" },
    };
    if (token) opts.headers.token = token;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.msg || "Request failed");
    return data;
}

function init() {
    if (token) {
        showPage("dashboard");
        loadOrgs();
    } else {
        showPage("auth");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    init();

    $$(".tab").forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));

    document.getElementById("form-signin").addEventListener("submit", async (e) => {
        e.preventDefault();
        const err = document.getElementById("signin-error");
        try {
            const data = await api("post", "signin", {
                username: document.getElementById("signin-username").value,
                password: document.getElementById("signin-password").value
            });
            token = data.token;
            localStorage.setItem("token", token);
            showPage("dashboard");
            loadOrgs();
        } catch (ex) { err.textContent = ex.message; }
    });

    document.getElementById("form-signup").addEventListener("submit", async (e) => {
        e.preventDefault();
        const err = document.getElementById("signup-error");
        try {
            await api("post", "signup", {
                username: document.getElementById("signup-username").value,
                password: document.getElementById("signup-password").value
            });
            err.textContent = "Account created! You can now sign in.";
            err.style.color = "#2ecc71";
            switchTab("signin");
        } catch (ex) { err.textContent = ex.message; }
    });

    document.getElementById("btn-logout").addEventListener("click", () => {
        token = null;
        localStorage.removeItem("token");
        currentOrgId = null;
        currentBoardId = null;
        showPage("auth");
    });

    document.getElementById("btn-create-org").addEventListener("click", async () => {
        const title = prompt("Organization title:");
        if (!title) return;
        const desc = prompt("Description:");
        try {
            await api("post", "organization", { title, description: desc || "" });
            loadOrgs();
        } catch (ex) { alert(ex.message); }
    });

    document.getElementById("btn-add-member").addEventListener("click", async () => {
        const username = document.getElementById("member-username").value;
        if (!username) return;
        try {
            await api("post", "add-member-to-organization", {
                organizationId: currentOrgId,
                memberUsername: username
            });
            document.getElementById("member-username").value = "";
            loadOrgDetail(currentOrgId);
        } catch (ex) { alert(ex.message); }
    });

    document.getElementById("btn-create-board").addEventListener("click", async () => {
        const title = document.getElementById("board-title").value;
        if (!title) return;
        try {
            await api("post", "board", { title, organizationId: currentOrgId });
            document.getElementById("board-title").value = "";
            loadBoards();
        } catch (ex) { alert(ex.message); }
    });

    document.getElementById("btn-back-org").addEventListener("click", () => {
        currentBoardId = null;
        document.getElementById("board-view").style.display = "none";
        document.getElementById("org-view").style.display = "block";
    });

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-add-card")) {
            const status = e.target.dataset.status;
            const input = document.querySelector(`.card-title-input[data-status="${status}"]`);
            const title = input.value.trim();
            if (!title) return;
            api("post", "issue", {
                title,
                boardId: currentBoardId,
                assignedTo: null
            }).then(() => {
                input.value = "";
                loadIssues();
            }).catch(alert);
        }
    });

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("card")) {
            const id = e.target.dataset.id;
            const statuses = ["todo", "in-progress", "done"];
            const current = e.target.dataset.status;
            const idx = statuses.indexOf(current);
            const next = statuses[(idx + 1) % statuses.length];
            api("put", `issue/${id}`, { status: next })
                .then(() => loadIssues())
                .catch(alert);
        }
    });

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-member")) {
            const username = e.target.dataset.username;
            api("delete", "members", { organizationId: currentOrgId, memberUsername: username })
                .then(() => loadOrgDetail(currentOrgId))
                .catch(alert);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.classList.contains("card-title-input")) {
            e.target.nextElementSibling.click();
        }
    });
});

async function loadOrgs() {
    try {
        const data = await api("get", "organization");
        organizations = data.organizations;
        const list = document.getElementById("org-list");
        list.innerHTML = organizations.map(o =>
            `<div class="org-item${currentOrgId === o._id ? " active" : ""}" data-id="${o._id}">
                <strong>${o.title}</strong><br><small>${o.description || ""}</small>
            </div>`
        ).join("");
        list.querySelectorAll(".org-item").forEach(el => {
            el.addEventListener("click", () => {
                currentOrgId = el.dataset.id;
                loadOrgDetail(currentOrgId);
                loadOrgs();
            });
        });
        if (currentOrgId) loadOrgDetail(currentOrgId);
    } catch (ex) { alert(ex.message); }
}

async function loadOrgDetail(id) {
    try {
        const data = await api("get", `organization/${id}`);
        const org = data.organization;
        document.getElementById("org-title").textContent = org.title;
        document.getElementById("org-desc").textContent = org.description;
        document.getElementById("org-admin").textContent = `Admin: ${org.adminUsername || "Unknown"}`;

        document.getElementById("member-list").innerHTML = org.members.map(m =>
            `<span class="member-chip">
                ${m.username}
                <span class="remove remove-member" data-username="${m.username}">×</span>
            </span>`
        ).join("");

        document.getElementById("org-view").style.display = "block";
        document.getElementById("board-view").style.display = "none";
        currentBoardId = null;
        loadBoards();
    } catch (ex) { alert(ex.message); }
}

async function loadBoards() {
    try {
        const data = await api("get", `boards/${currentOrgId}`);
        const list = document.getElementById("board-list");
        list.innerHTML = data.boards.map(b =>
            `<span class="board-card" data-id="${b._id}">${b.title}</span>`
        ).join("");
        list.querySelectorAll(".board-card").forEach(el => {
            el.addEventListener("click", () => {
                currentBoardId = el.dataset.id;
                document.getElementById("board-title-header").textContent = el.textContent;
                document.getElementById("org-view").style.display = "none";
                document.getElementById("board-view").style.display = "block";
                loadIssues();
            });
        });
    } catch (ex) { alert(ex.message); }
}

async function loadIssues() {
    try {
        const data = await api("get", `issues/${currentBoardId}`);
        ["todo", "in-progress", "done"].forEach(status => {
            const list = document.getElementById(`list-${status}`);
            const issues = data.issues.filter(i => i.status === status);
            list.innerHTML = issues.map(i =>
                `<div class="card" data-id="${i._id}" data-status="${i.status}">
                    <strong>${i.title}</strong>
                    ${i.description ? `<div class="card-desc">${i.description}</div>` : ""}
                    <div class="card-assignee">${i.assignedToUsername} · click to move</div>
                </div>`
            ).join("");
        });
    } catch (ex) { alert(ex.message); }
}

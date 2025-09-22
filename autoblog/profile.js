// profile.js (VERSÃO AJUSTADA)
// Página de perfil — carregamento de dados, grid de posts, detalhe, seguir, editar perfil

// Estado local
let currentProfileUser = null
let currentTab = "posts"
let profilePosts = []

// Preferir window.currentUser (definido pelo script principal) — fallback para localStorage
let localCurrentUser = null
try {
  localCurrentUser = window.currentUser || JSON.parse(localStorage.getItem("currentUser")) || null
} catch (e) {
  localCurrentUser = null
}

// Use uma referência coerente para o usuário atual
const getCurrentUser = () => window.currentUser || localCurrentUser || null

// Fallbacks para funções de UI (se não existirem globalmente)
const notify = (message, type = "info") => {
  if (typeof window.showNotification === "function") return window.showNotification(message, type)
  // fallback simples
  console[type === "error" ? "error" : "log"](`${type.toUpperCase()}: ${message}`)
  alert(`${type.toUpperCase()}: ${message}`)
}

const closeModal = (modalId) => {
  const modal = document.getElementById(modalId)
  if (!modal) return
  modal.classList.remove("modal-show")
  setTimeout(() => (modal.style.display = "none"), 300)
}

const showLoginModal = () => {
  if (typeof window.showLoginModal === "function") return window.showLoginModal()
  notify("Login modal deveria ser aberto aqui", "info")
}

// ---------------------------
// Init
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  const pathMatchesProfile = window.location.pathname.includes("profile") || document.body.dataset.page === "profile"
  if (pathMatchesProfile) {
    initializeProfile()
  }
})

// ---------------------------
// Inicialização da página
// ---------------------------
function initializeProfile() {
  checkAuthStatus()
  loadProfileData()
  setupProfileEventListeners()
}

// Se existe checkAuthStatus global, manter; senão, definir um leve
function checkAuthStatus() {
  if (typeof window.checkAuthStatus === "function") {
    return window.checkAuthStatus()
  }
  // fallback: atualiza UI local
  const u = getCurrentUser()
  if (u) console.log("Usuário autenticado:", u.email || u.nome)
}

// ---------------------------
// Event listeners
// ---------------------------
function setupProfileEventListeners() {
  // Forms
  document.addEventListener("submit", "#edit-profile-form", handleEditProfile)
  document.addEventListener("submit", "#detail-comment-form", handleDetailComment)

  // Tabs
  document.addEventListener("click", ".profile-nav-item", function (e) {
    e.preventDefault()
    const tab = this.getAttribute("data-tab")
    if (tab) setActiveTab(tab)
  })

  // Modal close buttons (delegated)
  document.addEventListener("click", ".modal-close, .modal-backdrop", function () {
    const modal = this.closest(".modal")
    closeModal(modal.getAttribute("id"))
  })

  // Post grid item click (delegated)
  document.addEventListener("click", ".post-grid-item", function () {
    const idx = this.getAttribute("data-post-index")
    if (typeof idx === "number") openPostDetail(idx)
  })

  // Follow button
  document.addEventListener("click", "#follow-btn", () => {
    toggleFollow()
  })

  // Edit profile button
  document.addEventListener("click", "#edit-profile-btn", showEditProfileModal)

  // Utility actions
  document.addEventListener("click", "#go-to-feed", goToFeed)
  document.addEventListener("click", "#go-to-my-profile", goToProfile)
  document.addEventListener("click", "#go-to-likes", goToLikes)
}

// ---------------------------
// Carregar dados do perfil
// ---------------------------
function loadProfileData() {
  const urlParams = new URLSearchParams(window.location.search)
  const userId = urlParams.get("user") || (getCurrentUser() ? getCurrentUser().id : null)

  if (!userId) {
    notify("Usuário não encontrado", "error")
    return
  }

  const endpoint = `backend/api/auth.php?action=get_user&id=${encodeURIComponent(userId)}`

  fetch(endpoint, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((response) => {
      if (response && response.user) {
        currentProfileUser = response.user
        displayProfileData(response.user)
        loadUserPosts(userId)
      } else {
        notify("Usuário não encontrado", "error")
      }
    })
    .catch((error) => {
      handleProfileError(error, "carregar perfil")
    })
}

function displayProfileData(user) {
  const current = getCurrentUser()
  const isOwnProfile = current && current.id === user.id

  // Segurança: valores default e escape minimal
  document.getElementById("profile-username").textContent =
    `@${(user.nome || "user").toString().toLowerCase()}${(user.sobrenome || "").toString().toLowerCase()}`
  document.getElementById("profile-name").textContent = `${user.nome || ""} ${user.sobrenome || ""}`.trim()
  document.getElementById("profile-description").textContent = user.biografia || "Apaixonado por carros e velocidade!"
  document.getElementById("profile-avatar").setAttribute("src", user.avatar_url || "/diverse-user-avatars.png")

  // Stats
  document.getElementById("posts-count").textContent = user.posts_count || 0
  document.getElementById("followers-count").textContent = user.followers_count || 0
  document.getElementById("following-count").textContent = user.following_count || 0

  // Buttons visibility
  if (isOwnProfile) {
    document.getElementById("edit-profile-btn").style.display = "block"
    document.getElementById("follow-btn").style.display = "none"
    document.getElementById("message-btn").style.display = "none"
  } else {
    document.getElementById("edit-profile-btn").style.display = "none"
    document.getElementById("follow-btn").style.display = "block"
    document.getElementById("message-btn").style.display = "block"
    checkFollowStatus(user.id)
  }

  // Title
  document.title = `${user.nome || ""} ${user.sobrenome || ""} - Perfil`
}

// ---------------------------
// Posts do usuário
// ---------------------------
function loadUserPosts(userId) {
  const $loading = document.getElementById("loading-state")
  const $grid = document.getElementById("posts-grid")
  const $empty = document.getElementById("empty-state")

  if ($loading) $loading.style.display = "block"
  if ($grid) $grid.innerHTML = ""
  if ($empty) $empty.style.display = "none"

  fetch(`backend/api/posts.php?action=by_user&user_id=${encodeURIComponent(userId)}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((response) => {
      if ($loading) $loading.style.display = "none"
      if (response && Array.isArray(response.posts) && response.posts.length > 0) {
        profilePosts = response.posts
        displayPostsGrid(response.posts)
      } else {
        profilePosts = []
        if ($empty) $empty.style.display = "block"
      }
    })
    .catch((error) => {
      handleProfileError(error, "carregar posts")
    })
}

function displayPostsGrid(posts) {
  const postsGrid = document.getElementById("posts-grid")
  if (!postsGrid) return
  postsGrid.innerHTML = ""

  posts.forEach((post, index) => {
    const postItem = createPostGridItem(post, index)
    // store index for delegated click
    const $item = document.createElement("div")
    $item.innerHTML = postItem
    $item.setAttribute("data-post-index", index)
    postsGrid.appendChild($item)
  })
}

function createPostGridItem(post, index) {
  const hasImages =
    (post.images && post.images.length > 0) ||
    (post.first_image && post.first_image.length) ||
    (post.total_images && post.total_images > 0) ||
    (post.attachments && post.attachments.length)

  const images = post.images || post.attachments || []
  const imageCount = images.length || post.total_images || 0
  const firstImg =
    post.first_image ||
    (images[0] && images[0].file_path) ||
    (images[0] && images[0].url) ||
    "/classic-red-convertible.png"

  const likesCount = post.total_likes || 0
  const commentsCount = post.total_comments || 0

  // Return HTML string; caller will set data-post-index
  return `
    <div class="post-grid-item" role="button" tabindex="0" aria-label="Abrir post ${index}" onclick="openPostDetail(${index})">
      <img src="${firstImg}" alt="${(post.titulo || "Post").replace(/"/g, "&quot;")}" loading="lazy">
      <div class="post-grid-overlay">
        <div class="overlay-stat">
          <i class="fas fa-heart"></i>
          <span>${likesCount}</span>
        </div>
        <div class="overlay-stat">
          <i class="fas fa-comment"></i>
          <span>${commentsCount}</span>
        </div>
        ${imageCount > 1 ? `<div class="overlay-stat"><i class="fas fa-images"></i><span>${imageCount}</span></div>` : ""}
      </div>
    </div>
  `
}

// ---------------------------
// Detalhe do post
// ---------------------------
function openPostDetail(postIndex) {
  const post = profilePosts[postIndex]
  if (!post) return

  const hasImages =
    (post.images && post.images.length > 0) ||
    (post.first_image && post.first_image.length) ||
    (post.total_images && post.total_images > 0) ||
    (post.attachments && post.attachments.length)

  const images = post.images || post.attachments || []
  const imageCount = images.length || post.total_images || 0
  const firstImg =
    post.first_image ||
    (images[0] && images[0].file_path) ||
    (images[0] && images[0].url) ||
    "/classic-red-convertible.png"

  // Populate modal elements safely
  const detailImage = document.getElementById("detail-post-image")
  detailImage.setAttribute("src", firstImg)

  detailImage.onclick = () => window.openImageModal(firstImg, post.titulo || "Post")

  const imageContainer = detailImage.parentElement
  const existingIndicator = imageContainer.querySelector(".image-count-indicator")
  if (existingIndicator) existingIndicator.remove()

  if (imageCount > 1) {
    const indicator = document.createElement("div")
    indicator.className = "image-count-indicator"
    indicator.innerHTML = `<i class="fas fa-images"></i> ${imageCount}`
    imageContainer.appendChild(indicator)
  }

  document.getElementById("detail-author-avatar").setAttribute("src", post.avatar_url || "/diverse-user-avatars.png")
  document.getElementById("detail-author-name").textContent = `${post.nome || ""} ${post.sobrenome || ""}`.trim()
  document.getElementById("detail-post-date").textContent = post.data_criacao
    ? new Date(post.data_criacao).toLocaleDateString("pt-BR")
    : ""
  document.getElementById("detail-post-title").textContent = post.titulo || ""
  document.getElementById("detail-post-content").textContent = post.corpo || ""
  document.getElementById("detail-like-count").textContent = post.total_likes || 0
  document.getElementById("detail-comment-count").textContent = post.total_comments || 0
  document.getElementById("detail-comment-post-id").value = post.id

  // Check liked state if available
  if (getCurrentUser()) checkPostLiked(post.id)

  // Load comments
  loadPostComments(post.id)

  // Show modal
  showModal("post-detail-modal")
}

// ---------------------------
// Comentários (detail)
function handleDetailComment(e) {
  e.preventDefault()

  const user = getCurrentUser()
  if (!user) {
    notify("Você precisa estar logado para comentar", "error")
    showLoginModal()
    return
  }

  const postId = document.getElementById("detail-comment-post-id").value
  const commentText = document.getElementById("detail-comment-text").value.trim()
  if (!commentText) {
    notify("Digite um comentário", "error")
    return
  }

  fetch("backend/api/comments.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ post_id: postId, comentario: commentText }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response && response.sucesso) {
        document.getElementById("detail-comment-text").value = ""
        loadPostComments(postId)
        const currentCount = Number.parseInt(document.getElementById("detail-comment-count").textContent) || 0
        document.getElementById("detail-comment-count").textContent = currentCount + 1
        notify("Comentário adicionado!", "success")
      } else {
        notify(response.erro || "Erro ao adicionar comentário", "error")
      }
    })
    .catch((error) => {
      handleProfileError(error, "adicionar comentário")
    })
}

// ---------------------------
// Likes (detail)
function toggleLikeDetail() {
  const user = getCurrentUser()
  if (!user) {
    notify("Você precisa estar logado para curtir posts", "error")
    showLoginModal()
    return
  }

  const postId = document.getElementById("detail-comment-post-id").value
  fetch("backend/api/likes.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ post_id: postId }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response && response.sucesso) {
        const likeBtn = document.getElementById("detail-like-btn")
        const likeCount = document.getElementById("detail-like-count")
        likeCount.textContent = response.likes
        if (response.liked) likeBtn.classList.add("liked")
        else likeBtn.classList.remove("liked")
      } else {
        notify(response.erro || "Erro no like", "error")
      }
    })
    .catch((error) => {
      handleProfileError(error, "processar like")
    })
}

function checkPostLiked(postId) {
  const user = getCurrentUser()
  if (!user) return
  fetch(`backend/api/likes.php?action=check&post_id=${encodeURIComponent(postId)}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((response) => {
      if (response && response.liked) document.getElementById("detail-like-btn").classList.add("liked")
    })
}

// ---------------------------
// Edit profile
function showEditProfileModal() {
  const user = getCurrentUser()
  if (!user || !currentProfileUser || user.id !== currentProfileUser.id) {
    notify("Você só pode editar seu próprio perfil", "error")
    return
  }

  document.getElementById("edit-nome").value = currentProfileUser.nome || ""
  document.getElementById("edit-sobrenome").value = currentProfileUser.sobrenome || ""
  document.getElementById("edit-biografia").value = currentProfileUser.biografia || ""
  showModal("edit-profile-modal")
}

function handleEditProfile(e) {
  e.preventDefault()

  const user = getCurrentUser()
  if (!user) {
    notify("Você precisa estar logado", "error")
    showLoginModal()
    return
  }

  const form = document.getElementById("edit-profile-form")
  if (!form) return
  const formData = new FormData(form)
  formData.append("action", "update_profile")

  const submitBtn = form.querySelector('button[type="submit"]')
  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'
  submitBtn.disabled = true

  fetch("backend/api/auth.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((response) => {
      if (response && response.sucesso) {
        notify("Perfil atualizado com sucesso!", "success")
        closeModal("edit-profile-modal")

        const cur = getCurrentUser()
        if (cur && response.usuario) {
          cur.nome = response.usuario.nome
          cur.sobrenome = response.usuario.sobrenome
          cur.biografia = response.usuario.biografia
          if (response.usuario.avatar_url) {
            cur.avatar_url = response.usuario.avatar_url
          }
          localStorage.setItem("currentUser", JSON.stringify(cur))
          window.currentUser = cur
        }

        loadProfileData()
      } else {
        notify(response.erro || "Erro ao atualizar perfil", "error")
      }
    })
    .catch((error) => {
      handleProfileError(error, "atualizar perfil")
    })
    .finally(() => {
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    })
}

// ---------------------------
// Follow / followers
function toggleFollow() {
  const user = getCurrentUser()
  if (!user) {
    notify("Você precisa estar logado para seguir usuários", "error")
    showLoginModal()
    return
  }
  if (!currentProfileUser) return

  fetch("backend/api/followers.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "toggle", following_id: currentProfileUser.id }),
  })
    .then((response) => response.json())
    .then((response) => {
      if (response && response.sucesso) {
        const followBtn = document.getElementById("follow-btn")
        const followersCount = document.getElementById("followers-count")
        const currentCount = Number.parseInt(followersCount.textContent) || 0
        if (response.following) {
          followBtn.classList.add("following")
          followBtn.innerHTML = '<i class="fas fa-user-check"></i> Seguindo'
          followersCount.textContent = currentCount + 1
          notify("Agora você está seguindo este usuário!", "success")
        } else {
          followBtn.classList.remove("following")
          followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir'
          followersCount.textContent = Math.max(0, currentCount - 1)
          notify("Você parou de seguir este usuário", "info")
        }
      } else {
        notify(response.erro || "Erro ao processar seguir", "error")
      }
    })
    .catch((error) => {
      handleProfileError(error, "processar seguir/deixar de seguir")
    })
}

function checkFollowStatus(userId) {
  const user = getCurrentUser()
  if (!user) return
  fetch(`backend/api/followers.php?action=check&following_id=${encodeURIComponent(userId)}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((response) => {
      const followBtn = document.getElementById("follow-btn")
      if (!followBtn) return
      if (response && response.following) {
        followBtn.classList.add("following")
        followBtn.innerHTML = '<i class="fas fa-user-check"></i> Seguindo'
      } else {
        followBtn.classList.remove("following")
        followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir'
      }
    })
}

// ---------------------------
// Tabs & misc UI
function showPosts() {
  setActiveTab("posts")
  if (currentProfileUser) loadUserPosts(currentProfileUser.id)
}
function showSaved() {
  setActiveTab("saved")
  notify("Funcionalidade em desenvolvimento", "info")
}
function showTagged() {
  setActiveTab("tagged")
  notify("Funcionalidade em desenvolvimento", "info")
}

function setActiveTab(tab) {
  currentTab = tab
  document.querySelectorAll(".profile-nav-item").forEach((item) => item.classList.remove("active"))
  document.querySelector(`.profile-nav-item[data-tab="${tab}"]`).classList.add("active")
}

function showFollowersModal() {
  showModal("followers-modal")
}
function showFollowingModal() {
  showModal("following-modal")
}
function focusCommentInput() {
  document.getElementById("detail-comment-text").focus()
}
function sharePost() {
  notify("Funcionalidade de compartilhamento em desenvolvimento", "info")
}
function sendMessage() {
  notify("Funcionalidade de mensagens em desenvolvimento", "info")
}
function editAvatar() {
  const fileInput = document.getElementById("edit-avatar")
  fileInput.click()

  fileInput.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify("Arquivo muito grande. Máximo 5MB", "error")
        fileInput.value = ""
        return
      }

      if (!file.type.startsWith("image/")) {
        notify("Por favor, selecione apenas arquivos de imagem", "error")
        fileInput.value = ""
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const profileAvatar = document.getElementById("profile-avatar")
        if (profileAvatar) {
          profileAvatar.src = e.target.result
        }
      }
      reader.readAsDataURL(file)

      notify("Imagem selecionada! Clique em 'Salvar Alterações' para confirmar", "info")
    }
  }
}

function goToFeed() {
  window.location.href = "index.html"
}
function goToProfile() {
  const u = getCurrentUser()
  if (u) {
    window.location.href = `profile.html?user=${u.id}`
  } else {
    showLoginModal()
  }
}

function goToLikes() {
  if (!getCurrentUser()) {
    notify("Você precisa estar logado para ver curtidas", "error")
    showLoginModal()
    return
  }
  window.location.href = "likes.html"
}

function showExplore() {
  notify("Página de explorar em desenvolvimento", "info")
}
function showNotifications() {
  notify("Notificações em desenvolvimento", "info")
}

// ---------------------------
// Helper: escape HTML
function escapeHtml(s) {
  if (!s) return ""
  return String(s).replace(
    /[&<>"']/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
  )
}

function showModal(modalId) {
  const modal = document.getElementById(modalId)
  if (!modal) return
  modal.style.display = "block"
  setTimeout(() => modal.classList.add("modal-show"), 10)
}

function handleProfileError(error, context = "") {
  console.error(`Profile error in ${context}:`, error)
  notify(`Erro ${context ? "em " + context : "no perfil"}`, "error")
}

window.openImageModal = (imageSrc, title) => {
  const modal = document.createElement("div")
  modal.className = "image-modal"
  modal.id = "image-modal"
  modal.innerHTML = `
    <div class="image-modal-content">
      <span class="image-modal-close">&times;</span>
      <img src="${imageSrc}" alt="${title}" class="modal-image">
      <div class="image-modal-caption">${title}</div>
    </div>
  `

  document.body.appendChild(modal)
  modal.style.display = "block"
  setTimeout(() => modal.classList.add("modal-show"), 10)

  modal.querySelector(".image-modal-close").onclick = () => window.closeImageModal()
  modal.onclick = (e) => {
    if (e.target === modal) window.closeImageModal()
  }
}

window.openImageGallery = (postId, startIndex = 0) => {
  const post = profilePosts.find((p) => p.id == postId)
  if (!post) return

  const images = post.images || post.attachments || []
  if (images.length > startIndex) {
    const img = images[startIndex]
    const imgSrc = img.file_path || img.url || img
    window.openImageModal(imgSrc, post.titulo || "Post")
  }
}

window.closeImageModal = () => {
  const modal = document.getElementById("image-modal")
  if (modal) {
    modal.classList.remove("modal-show")
    setTimeout(() => modal.remove(), 300)
  }
}

function loadPostComments(postId) {
  console.log(`Loading comments for post ${postId}`)
}

console.log("[v0] Página de perfil inicializada (ajustado)")

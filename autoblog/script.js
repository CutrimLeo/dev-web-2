// script.js - CARSCLUB Social Media Platform
// Enhanced version with proper error handling and functionality

// Global variables
let currentUser = null
let currentPage = 1
const postsPerPage = 6
let isLoading = false
let hasMorePosts = true

// Ensure jQuery is available
const $ =
  window.jQuery ||
  (() => {
    throw new Error("jQuery não encontrado")
  })()

// ---------------------------
// Utility Functions
// ---------------------------

// Show notification to user
function showNotification(message, type = "info") {
  const container = $("#notification-container")
  if (!container.length) {
    $("body").append('<div id="notification-container"></div>')
  }

  const notification = $(`
    <div class="notification notification-${type}">
      <i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="closeNotification(this)">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `)

  $("#notification-container").append(notification)

  setTimeout(() => {
    notification.addClass("notification-exit")
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

function closeNotification(button) {
  const notification = $(button).closest(".notification")
  notification.addClass("notification-exit")
  setTimeout(() => notification.remove(), 300)
}

// Error handling
function handleError(error, context = "") {
  console.error(`Error in ${context}:`, error)
  showNotification(`Erro ${context ? "em " + context : "na operação"}`, "error")
}

// ---------------------------
// Skeleton Loading Functions
// ---------------------------
function showSkeletonLoading() {
  const skeletonHTML = `
    <div class="post-skeleton">
      <div class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-info">
          <div class="skeleton-line skeleton-name"></div>
          <div class="skeleton-line skeleton-date"></div>
        </div>
      </div>
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text short"></div>
      </div>
    </div>
  `

  const feed = $("#posts-feed").length ? $("#posts-feed") : $("#posts-grid")
  if (!feed.length) return

  for (let i = 0; i < 3; i++) {
    feed.append(skeletonHTML)
  }
}

function hideSkeletonLoading() {
  $(".post-skeleton").remove()
}

// ---------------------------
// Authentication Functions
// ---------------------------
function checkAuthStatus() {
  $.ajax({
    url: "backend/api/auth.php?action=check",
    method: "GET",
    success: (response) => {
      if (response && response.autenticado && response.usuario) {
        currentUser = response.usuario
        localStorage.setItem("currentUser", JSON.stringify(currentUser))
        updateAuthUI()
      } else {
        // Clear invalid local data
        localStorage.removeItem("currentUser")
        currentUser = null
        updateAuthUI()
      }
    },
    error: () => {
      // Fallback to localStorage check
      const userData = localStorage.getItem("currentUser")
      if (userData) {
        try {
          currentUser = JSON.parse(userData)
          updateAuthUI()
        } catch (e) {
          console.error("Error parsing user data:", e)
          localStorage.removeItem("currentUser")
          currentUser = null
          updateAuthUI()
        }
      } else {
        updateAuthUI()
      }
    },
  })
}

function updateAuthUI() {
  if (currentUser) {
    $("#nav-auth").hide()
    $("#nav-user").show()
    $("#user-name").text(currentUser.nome || currentUser.email || "Usuário")

    // Update global user reference
    window.currentUser = currentUser

    // Add floating action button for mobile
    if (!$(".fab").length) {
      $("body").append(
        '<button class="fab" id="fab-create-post" title="Criar Post" aria-label="Criar Post"><i class="fas fa-plus"></i></button>',
      )
      $(document).on("click", "#fab-create-post", showPostModal)
    }
  } else {
    $("#nav-auth").show()
    $("#nav-user").hide()
    $(".fab").remove()
    window.currentUser = null
  }
}

function updateUIForLoggedInUser() {
  localStorage.setItem("currentUser", JSON.stringify(currentUser))
  updateAuthUI()
  loadPosts(1) // Reload posts for authenticated user
}

// ---------------------------
// Modal Functions
// ---------------------------
function showModal(modalId) {
  const modal = $(`#${modalId}`)
  if (modal.length) {
    modal.css("display", "block")
    setTimeout(() => modal.addClass("modal-show"), 10)

    // Focus first input
    modal.find("input, textarea").first().focus()
  }
}

function closeModal(modalId) {
  const modal = $(`#${modalId}`)
  if (modal.length) {
    modal.removeClass("modal-show")
    setTimeout(() => {
      modal.css("display", "none")
      // Reset form if exists
      modal.find("form")[0]?.reset()
      // Clear image preview
      modal.find("#image-preview").empty()
    }, 300)
  }
}

function showLoginModal() {
  showModal("login-modal")
}

function showRegisterModal() {
  showModal("register-modal")
}

function showPostModal() {
  if (!currentUser) {
    showNotification("Faça login para criar posts", "error")
    showLoginModal()
    return
  }
  showModal("post-modal")
}

function showCommentsModal(postId) {
  $("#comment-post-id").val(postId)
  loadComments(postId)
  showModal("comments-modal")
}

function showLoginModalGlobal() {
  // Create login modal if it doesn't exist
  if (!$("#login-modal").length) {
    const loginModalHTML = `
      <div id="login-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Entrar</h2>
            <button class="modal-close" onclick="closeModal('login-modal')">&times;</button>
          </div>
          <form id="login-form">
            <div class="form-group">
              <label for="login-email">Email:</label>
              <input type="email" id="login-email" required>
            </div>
            <div class="form-group">
              <label for="login-password">Senha:</label>
              <input type="password" id="login-password" required>
            </div>
            <button type="submit">Entrar</button>
          </form>
          <p class="modal-footer">
            Não tem conta? <a href="#" onclick="closeModal('login-modal'); showRegisterModalGlobal();">Cadastre-se</a>
          </p>
        </div>
      </div>
    `
    $("body").append(loginModalHTML)
  }
  showModal("login-modal")
}

function showRegisterModalGlobal() {
  // Create register modal if it doesn't exist
  if (!$("#register-modal").length) {
    const registerModalHTML = `
      <div id="register-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Cadastrar</h2>
            <button class="modal-close" onclick="closeModal('register-modal')">&times;</button>
          </div>
          <form id="register-form">
            <div class="form-group">
              <label for="register-nome">Nome:</label>
              <input type="text" id="register-nome" required>
            </div>
            <div class="form-group">
              <label for="register-sobrenome">Sobrenome:</label>
              <input type="text" id="register-sobrenome">
            </div>
            <div class="form-group">
              <label for="register-email">Email:</label>
              <input type="email" id="register-email" required>
            </div>
            <div class="form-group">
              <label for="register-password">Senha:</label>
              <input type="password" id="register-password" required>
            </div>
            <div class="form-group">
              <label for="register-biografia">Biografia:</label>
              <textarea id="register-biografia" rows="3"></textarea>
            </div>
            <button type="submit">Cadastrar</button>
          </form>
          <p class="modal-footer">
            Já tem conta? <a href="#" onclick="closeModal('register-modal'); showLoginModalGlobal();">Entre aqui</a>
          </p>
        </div>
      </div>
    `
    $("body").append(registerModalHTML)
  }
  showModal("register-modal")
}

// ---------------------------
// API Helper Functions
// ---------------------------
function apiRequest(url, options = {}) {
  const defaultOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  }

  const token = localStorage.getItem("auth_token") || getCookie("auth_token")
  if (token) {
    defaultOptions.headers["Authorization"] = `Bearer ${token}`
  }

  return $.ajax({
    url,
    method: defaultOptions.method,
    data: defaultOptions.body,
    contentType: defaultOptions.headers["Content-Type"],
    processData: defaultOptions.method === "GET",
    headers: defaultOptions.headers,
    ...options,
  })
}

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(";").shift()
}

// ---------------------------
// Posts Functions
// ---------------------------
function loadPosts(page = 1) {
  if (isLoading) return
  isLoading = true

  if (page === 1) {
    showSkeletonLoading()
  } else {
    $("#loading-indicator").show()
  }

  const url = `backend/api/posts.php?action=all&limit=${postsPerPage}&page=${page}`

  $.ajax({
    url,
    method: "GET",
    success: (response) => {
      hideSkeletonLoading()
      $("#loading-indicator").hide()

      if (!response || !response.posts) {
        showNotification("Resposta inválida ao carregar posts", "error")
        return
      }

      if (page === 1) {
        displayPosts(response.posts)
      } else {
        appendPosts(response.posts)
      }

      // Update pagination state
      if (response.posts.length < postsPerPage) {
        hasMorePosts = false
      } else {
        hasMorePosts = true
        currentPage = page
      }

      // Animate new posts
      setTimeout(() => {
        $(".post-card:not(.animate-in)").each((index, element) => {
          setTimeout(() => $(element).addClass("animate-in"), index * 80)
        })
      }, 50)
    },
    error: (xhr, status, error) => {
      hideSkeletonLoading()
      $("#loading-indicator").hide()
      handleError(error, "carregar posts")
    },
    complete: () => {
      isLoading = false
    },
  })
}

function displayPosts(posts) {
  const feed = $("#posts-feed").length ? $("#posts-feed") : $("#posts-grid")
  if (!feed.length) return

  feed.empty()
  posts.forEach((post) => {
    const postElement = createPostElement(post)
    feed.append(postElement)
  })
}

function appendPosts(posts) {
  const feed = $("#posts-feed").length ? $("#posts-feed") : $("#posts-grid")
  if (!feed.length) return

  posts.forEach((post) => {
    const postElement = createPostElement(post)
    feed.append(postElement)
  })
}

function createPostElement(post) {
  const userInitials = getUserInitials(post.autor_nome || post.nome || "U")
  const postDate = formatDate(post.data_criacao)
  const isLiked = post.user_liked || false
  const likesCount = post.total_likes || 0
  const commentsCount = post.total_comentarios || 0

  let imagesHTML = ""
  if (post.attachments && post.attachments.length > 0) {
    const imageCount = post.attachments.length
    let imageClass = "single-image"

    if (imageCount === 2) imageClass = "two-images"
    else if (imageCount === 3) imageClass = "three-images"
    else if (imageCount === 4) imageClass = "four-images"
    else if (imageCount >= 5) imageClass = "five-images"

    imagesHTML = `
      <div class="post-images multiple-images ${imageClass}">
        ${post.attachments
          .slice(0, 5)
          .map((img) => {
            let imagePath = img.caminho
            if (!imagePath.startsWith("/") && !imagePath.startsWith("http")) {
              imagePath = "/" + imagePath
            }
            return `<img src="${imagePath}" alt="Post image" onclick="openImageModal('${imagePath}')" loading="lazy" onerror="this.style.display='none'">`
          })
          .join("")}
      </div>
    `
  }

  return $(`
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-header">
        <div class="post-avatar">${userInitials}</div>
        <div class="post-user-info">
          <div class="post-username">${post.autor_nome || post.nome || "Usuário"}</div>
          <div class="post-date">${postDate}</div>
        </div>
        <button class="post-menu" onclick="showPostMenu(${post.id})">
          <i class="fas fa-ellipsis-h"></i>
        </button>
      </header>
      
      ${imagesHTML}
      
      <div class="post-content">
        ${post.titulo ? `<h3 class="post-title">${escapeHtml(post.titulo)}</h3>` : ""}
        <p class="post-body">${escapeHtml(post.corpo)}</p>
      </div>
      
      <div class="post-actions">
        <button class="action-btn ${isLiked ? "liked" : ""}" onclick="toggleLike(${post.id}, this)">
          <i class="fas fa-heart"></i>
          <span>${likesCount}</span>
        </button>
        <button class="action-btn" onclick="showCommentsModal(${post.id})">
          <i class="fas fa-comment"></i>
          <span>${commentsCount}</span>
        </button>
        <button class="action-btn" onclick="sharePost(${post.id})">
          <i class="fas fa-share"></i>
          <span>Compartilhar</span>
        </button>
      </div>
    </article>
  `)
}

// ---------------------------
// Form Handlers
// ---------------------------
function handleLogin(e) {
  e.preventDefault()

  const email = $("#login-email").val().trim()
  const password = $("#login-password").val()

  if (!email || !password) {
    showNotification("Por favor, preencha todos os campos", "error")
    return
  }

  const submitBtn = $('#login-form button[type="submit"]')
  const originalText = submitBtn.html()
  submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Entrando...').prop("disabled", true)

  $.ajax({
    url: "backend/api/auth.php",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ action: "login", email, senha: password }),
    success: (response) => {
      if (response && response.sucesso) {
        showNotification("Login realizado com sucesso!", "success")
        currentUser = response.usuario

        if (response.token) {
          localStorage.setItem("auth_token", response.token)
        }

        updateUIForLoggedInUser()
        closeModal("login-modal")
        $("#login-form")[0].reset()
      } else {
        showNotification(response?.erro || "Erro no login", "error")
      }
    },
    error: (xhr, status, error) => {
      handleError(error, "login")
    },
    complete: () => {
      submitBtn.html(originalText).prop("disabled", false)
    },
  })
}

function handleRegister(e) {
  e.preventDefault()

  const nome = $("#register-nome").val().trim()
  const sobrenome = $("#register-sobrenome").val().trim()
  const email = $("#register-email").val().trim()
  const password = $("#register-password").val()
  const biografia = $("#register-biografia").val().trim()

  if (!nome || !email || !password) {
    showNotification("Nome, email e senha são obrigatórios", "error")
    return
  }

  if (password.length < 6) {
    showNotification("A senha deve ter pelo menos 6 caracteres", "error")
    return
  }

  const submitBtn = $('#register-form button[type="submit"]')
  const originalText = submitBtn.html()
  submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Cadastrando...').prop("disabled", true)

  $.ajax({
    url: "backend/api/auth.php",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ action: "register", nome, sobrenome, email, senha: password, biografia }),
    success: (response) => {
      if (response && response.sucesso) {
        showNotification("Cadastro realizado com sucesso!", "success")
        closeModal("register-modal")
        $("#register-form")[0].reset()

        if (!currentUser) {
          setTimeout(() => {
            // Automatically login with the same credentials
            $.ajax({
              url: "backend/api/auth.php",
              method: "POST",
              contentType: "application/json",
              data: JSON.stringify({ action: "login", email, senha: password }),
              success: (loginResponse) => {
                if (loginResponse && loginResponse.sucesso) {
                  showNotification("Login automático realizado!", "success")
                  currentUser = loginResponse.usuario

                  if (loginResponse.token) {
                    localStorage.setItem("auth_token", loginResponse.token)
                  }

                  updateUIForLoggedInUser()
                } else {
                  // If auto-login fails, show login modal
                  setTimeout(() => showLoginModal(), 1000)
                }
              },
              error: () => {
                // If auto-login fails, show login modal
                setTimeout(() => showLoginModal(), 1000)
              },
            })
          }, 500)
        }
      } else {
        showNotification(response?.erro || "Erro no cadastro", "error")
      }
    },
    error: (xhr, status, error) => {
      handleError(error, "cadastro")
    },
    complete: () => {
      submitBtn.html(originalText).prop("disabled", false)
    },
  })
}

function handleCreatePost(e) {
  e.preventDefault()

  if (!currentUser) {
    showNotification("Faça login para criar posts", "error")
    return
  }

  const titulo = $("#post-title").val().trim()
  const corpo = $("#post-content").val().trim()
  const images = $("#post-images")[0].files

  if (!corpo) {
    showNotification("O conteúdo do post é obrigatório", "error")
    return
  }

  const submitBtn = $('#post-form button[type="submit"]')
  const originalText = submitBtn.html()
  submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Publicando...').prop("disabled", true)

  const formData = new FormData()
  formData.append("titulo", titulo)
  formData.append("corpo", corpo)

  // Add images if any
  if (images.length > 0) {
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      formData.append("images[]", images[i])
    }
  }

  $.ajax({
    url: "backend/api/posts.php",
    method: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: (response) => {
      if (response && response.sucesso) {
        showNotification("Post criado com sucesso!", "success")
        closeModal("post-modal")
        $("#post-form")[0].reset()
        $("#image-preview").empty()
        loadPosts(1) // Reload posts
      } else {
        showNotification(response?.erro || "Erro ao criar post", "error")
      }
    },
    error: (xhr, status, error) => {
      handleError(error, "criar post")
    },
    complete: () => {
      submitBtn.html(originalText).prop("disabled", false)
    },
  })
}

function handleCommentSubmit(e) {
  e.preventDefault()

  if (!currentUser) {
    showNotification("Faça login para comentar", "error")
    return
  }

  const postId = $("#comment-post-id").val()
  const comentario = $("#comment-text").val().trim()

  if (!comentario) {
    showNotification("Digite um comentário", "error")
    return
  }

  const submitBtn = $('#comment-form button[type="submit"]')
  const originalText = submitBtn.html()
  submitBtn.html('<i class="fas fa-spinner fa-spin"></i>').prop("disabled", true)

  $.ajax({
    url: "backend/api/comments.php",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ post_id: postId, comentario }),
    success: (response) => {
      if (response && response.sucesso) {
        $("#comment-text").val("")
        loadComments(postId) // Reload comments
        showNotification("Comentário adicionado!", "success")
      } else {
        showNotification(response?.erro || "Erro ao adicionar comentário", "error")
      }
    },
    error: (xhr, status, error) => {
      handleError(error, "adicionar comentário")
    },
    complete: () => {
      submitBtn.html(originalText).prop("disabled", false)
    },
  })
}

// ---------------------------
// Image Handling
// ---------------------------
function handleImageSelection(e) {
  const files = e.target.files
  const preview = $("#image-preview")
  preview.empty()

  if (files.length > 5) {
    showNotification("Máximo de 5 imagens permitidas", "error")
    e.target.value = ""
    return
  }

  Array.from(files).forEach((file, index) => {
    if (!file.type.startsWith("image/")) {
      showNotification("Apenas imagens são permitidas", "error")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const previewItem = $(`
        <div class="preview-item">
          <img src="${e.target.result}" alt="Preview">
          <button type="button" class="preview-remove" onclick="removeImagePreview(this, ${index})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `)
      preview.append(previewItem)
    }
    reader.readAsDataURL(file)
  })
}

function removeImagePreview(button, index) {
  $(button).closest(".preview-item").remove()

  // Update file input
  const fileInput = $("#post-images")[0]
  const dt = new DataTransfer()
  const files = Array.from(fileInput.files)

  files.forEach((file, i) => {
    if (i !== index) {
      dt.items.add(file)
    }
  })

  fileInput.files = dt.files
}

function openImageModal(imageSrc) {
  const modal = $(`
    <div class="image-modal" onclick="closeImageModal()">
      <div class="image-modal-content">
        <img src="${imageSrc}" alt="Full size image" class="modal-image">
        <button class="image-modal-close" onclick="closeImageModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `)

  $("body").append(modal)
  setTimeout(() => modal.addClass("modal-show"), 10)
}

function closeImageModal() {
  $(".image-modal").removeClass("modal-show")
  setTimeout(() => $(".image-modal").remove(), 300)
}

// ---------------------------
// Social Actions
// ---------------------------
function toggleLike(postId, button) {
  if (!currentUser) {
    showNotification("Faça login para curtir posts", "error")
    showLoginModal()
    return
  }

  const $button = $(button)
  const isLiked = $button.hasClass("liked")
  const action = isLiked ? "unlike" : "like"

  $.ajax({
    url: "backend/api/likes.php",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ post_id: postId, action }),
    success: (response) => {
      if (response && response.sucesso) {
        $button.toggleClass("liked")
        const countSpan = $button.find("span")
        let count = Number.parseInt(countSpan.text()) || 0
        count = isLiked ? count - 1 : count + 1
        countSpan.text(Math.max(0, count))
      } else {
        showNotification(response?.erro || "Erro ao curtir post", "error")
      }
    },
    error: (xhr, status, error) => {
      handleError(error, "curtir post")
    },
  })
}

function sharePost(postId) {
  if (navigator.share) {
    navigator.share({
      title: "CARSCLUB Post",
      text: "Confira este post no CARSCLUB!",
      url: `${window.location.origin}/?post=${postId}`,
    })
  } else {
    // Fallback: copy to clipboard
    const url = `${window.location.origin}/?post=${postId}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showNotification("Link copiado para a área de transferência!", "success")
      })
      .catch(() => {
        showNotification("Erro ao copiar link", "error")
      })
  }
}

// ---------------------------
// Comments
// ---------------------------
function loadComments(postId) {
  $("#comments-list").html(
    '<div class="loading-indicator"><div class="spinner"></div><span>Carregando comentários...</span></div>',
  )

  $.ajax({
    url: `backend/api/comments.php?post_id=${postId}`,
    method: "GET",
    success: (response) => {
      if (response && response.comentarios) {
        displayComments(response.comentarios)
      } else {
        $("#comments-list").html(
          '<p style="text-align: center; color: var(--text-muted);">Nenhum comentário ainda.</p>',
        )
      }
    },
    error: (xhr, status, error) => {
      $("#comments-list").html(
        '<p style="text-align: center; color: var(--text-muted);">Erro ao carregar comentários.</p>',
      )
      handleError(error, "carregar comentários")
    },
  })
}

function displayComments(comments) {
  const commentsList = $("#comments-list")
  commentsList.empty()

  if (comments.length === 0) {
    commentsList.html('<p style="text-align: center; color: var(--text-muted);">Nenhum comentário ainda.</p>')
    return
  }

  comments.forEach((comment) => {
    const userInitials = getUserInitials(comment.autor_nome || comment.nome || "U")
    const commentDate = formatDate(comment.data_criacao)

    const commentElement = $(`
      <div class="comment-item">
        <div class="comment-avatar">${userInitials}</div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-author">${comment.autor_nome || comment.nome || "Usuário"}</span>
            <span class="comment-date">${commentDate}</span>
          </div>
          <p class="comment-text">${escapeHtml(comment.comentario)}</p>
        </div>
      </div>
    `)

    commentsList.append(commentElement)
  })
}

// ---------------------------
// Navigation Functions
// ---------------------------
function goToFeed() {
  window.location.href = "index.html"
}

function goToProfile() {
  window.location.href = "profile.html"
}

function showExplore() {
  showNotification("Funcionalidade em desenvolvimento", "info")
}

function logout() {
  $.ajax({
    url: "backend/api/auth.php",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ action: "logout" }),
    success: () => {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("currentUser")
      currentUser = null
      updateAuthUI()
      showNotification("Logout realizado com sucesso!", "success")
      loadPosts(1) // Reload posts for anonymous user
    },
    error: (xhr, status, error) => {
      // Even if server logout fails, clear local data
      localStorage.removeItem("auth_token")
      localStorage.removeItem("currentUser")
      currentUser = null
      updateAuthUI()
      showNotification("Logout realizado!", "info")
    },
  })
}

// ---------------------------
// Search Functions
// ---------------------------
function searchPosts() {
  const query = $("#search-input").val().trim()
  if (!query) {
    loadPosts(1)
    return
  }

  showSkeletonLoading()

  $.ajax({
    url: `backend/api/posts.php?action=search_content&query=${encodeURIComponent(query)}`,
    method: "GET",
    success: (response) => {
      hideSkeletonLoading()
      if (response && response.posts) {
        displayPosts(response.posts)
        showNotification(`${response.posts.length} posts encontrados`, "success")
      } else {
        displayPosts([])
        showNotification("Nenhum post encontrado", "info")
      }
    },
    error: (xhr, status, error) => {
      hideSkeletonLoading()
      handleError(error, "buscar posts")
    },
  })
}

// ---------------------------
// Utility Functions
// ---------------------------
function getUserInitials(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return "Hoje"
  if (diffDays === 2) return "Ontem"
  if (diffDays <= 7) return `${diffDays} dias atrás`

  return date.toLocaleDateString("pt-BR")
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// ---------------------------
// Event Listeners Setup
// ---------------------------
function setupEventListeners() {
  // Modal close on outside click
  $(document).on("click", ".modal", function (e) {
    if (e.target === this) {
      $(this).removeClass("modal-show")
      setTimeout(() => $(this).css("display", "none"), 300)
    }
  })

  // Form submissions
  $(document).on("submit", "#login-form", handleLogin)
  $(document).on("submit", "#register-form", handleRegister)
  $(document).on("submit", "#post-form", handleCreatePost)
  $(document).on("submit", "#comment-form", handleCommentSubmit)

  // Search functionality
  $(document).on("keypress", "#search-input", (e) => {
    if (e.which === 13) {
      e.preventDefault()
      searchPosts()
    }
  })

  // Image upload preview
  $(document).on("change", "#post-images", handleImageSelection)

  // Mobile menu toggle
  $(document).on("click", "#nav-toggle", () => {
    $(".nav-container").toggleClass("active")
  })

  // Infinite scroll
  $(window).on("scroll", () => {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 1000) {
      if (hasMorePosts && !isLoading) {
        loadPosts(currentPage + 1)
      }
    }
  })

  // Keyboard navigation
  $(document).on("keydown", (e) => {
    if (e.key === "Escape") {
      $(".modal.modal-show").each(function () {
        $(this).removeClass("modal-show")
        setTimeout(() => $(this).css("display", "none"), 300)
      })
      closeImageModal()
    }
  })
}

// ---------------------------
// Initialization
// ---------------------------
$(document).ready(() => {
  console.log("[v0] CARSCLUB initialized")

  // Setup event listeners
  setupEventListeners()

  // Check authentication status
  checkAuthStatus()

  // Load initial posts
  loadPosts(1)

  // Expose functions globally for onclick handlers
  window.showLoginModal = showLoginModal
  window.showRegisterModal = showRegisterModal
  window.showLoginModalGlobal = showLoginModalGlobal
  window.showRegisterModalGlobal = showRegisterModalGlobal
  window.showPostModal = showPostModal
  window.showCommentsModal = showCommentsModal
  window.closeModal = closeModal
  window.toggleLike = toggleLike
  window.sharePost = sharePost
  window.goToFeed = goToFeed
  window.goToProfile = goToProfile
  window.showExplore = showExplore
  window.logout = logout
  window.openImageModal = openImageModal
  window.closeImageModal = closeImageModal
  window.removeImagePreview = removeImagePreview
  window.closeNotification = closeNotification

  console.log("[v0] All functions loaded and ready")
})

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showNotification,
    handleError,
    loadPosts,
    toggleLike,
    sharePost,
  }
}

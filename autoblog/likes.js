// likes.js - Enhanced liked posts functionality
// Import jQuery (assume já carregado na página)
const $ =
  window.jQuery ||
  (() => {
    throw new Error("jQuery não encontrado")
  })()

$(document).ready(() => {
  let currentUser = null
  try {
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      currentUser = JSON.parse(userData)
    }
  } catch (e) {
    console.error("Error parsing user data:", e)
  }

  if (!currentUser || !currentUser.id) {
    // Redirect to login if no user
    window.location.href = "index.html"
    return
  }

  const userId = currentUser.id

  // Use global showNotification if available, otherwise fallback
  const showNotification =
    window.showNotification ||
    ((message, type) => {
      console[type === "error" ? "error" : "log"](`${type.toUpperCase()}: ${message}`)
      alert(`${type.toUpperCase()}: ${message}`)
    })

  function loadLikedPosts(start = "", end = "") {
    $("#loading-indicator").show()
    $("#posts-feed").empty()

    let url = `backend/api/posts.php?action=getLikedPostsByUser&user_id=${userId}`
    if (start) url += `&start_date=${start}`
    if (end) url += `&end_date=${end}`

    // Add authentication token
    const token = localStorage.getItem("auth_token")
    const headers = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    $.ajax({
      url,
      method: "GET",
      headers,
      dataType: "json",
      success: (response) => {
        $("#loading-indicator").hide()

        if (response && response.posts && response.posts.length > 0) {
          response.posts.forEach((post) => {
            const postCard = createLikedPostCard(post)
            $("#posts-feed").append(postCard)
          })
        } else {
          $("#posts-feed").html(`
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-heart-broken"></i>
                            </div>
                            <h3>Nenhum post curtido</h3>
                            <p>Você ainda não curtiu nenhum post neste período.</p>
                        </div>
                    `)
        }
      },
      error: (xhr) => {
        $("#loading-indicator").hide()
        if (xhr.status === 401) {
          showNotification("Sessão expirada. Faça login novamente.", "error")
          setTimeout(() => (window.location.href = "index.html"), 2000)
        } else {
          showNotification("Erro ao carregar posts curtidos", "error")
        }
      },
    })
  }

  function createLikedPostCard(post) {
    const authorName = `${post.nome || ""} ${post.sobrenome || ""}`.trim() || "Usuário"
    const postDate = post.data_criacao ? new Date(post.data_criacao).toLocaleDateString("pt-BR") : ""

    const images = post.attachments || post.images || []
    const imageCount = images.length || post.total_images || 0
    const firstImg = images[0]?.caminho || images[0]?.file_path || images[0]?.url || post.first_image || ""

    let imageSection = ""
    if (imageCount > 0 && firstImg) {
      if (imageCount === 1) {
        imageSection = `
          <div class="post-images single-image" onclick="window.openImageModal('${firstImg}', '${post.titulo || "Post"}')">
            <img src="${firstImg}" alt="${post.titulo || "Post"}" loading="lazy" onerror="this.style.display='none'">
          </div>
        `
      } else if (imageCount === 2) {
        imageSection = `
          <div class="post-images two-images">
            <div class="image-grid-2">
              ${images
                .slice(0, 2)
                .map(
                  (img, index) => `
                <div class="grid-image" onclick="window.openImageGallery(${post.id}, ${index})">
                  <img src="${img.caminho || img.file_path || img.url || img}" alt="${post.titulo || "Post"} ${index + 1}" loading="lazy" onerror="this.style.display='none'">
                </div>
              `,
                )
                .join("")}
            </div>
            <div class="image-count-indicator">
              <i class="fas fa-images"></i> ${imageCount}
            </div>
          </div>
        `
      } else if (imageCount >= 3) {
        const displayImages = images.slice(0, 3)
        const remainingCount = imageCount - 3

        imageSection = `
          <div class="post-images multiple-images">
            <div class="image-grid-3">
              ${displayImages
                .map(
                  (img, index) => `
                <div class="grid-image ${index === 2 && remainingCount > 0 ? "has-overlay" : ""}" onclick="window.openImageGallery(${post.id}, ${index})">
                  <img src="${img.caminho || img.file_path || img.url || img}" alt="${post.titulo || "Post"} ${index + 1}" loading="lazy" onerror="this.style.display='none'">
                  ${index === 2 && remainingCount > 0 ? `<div class="image-overlay">+${remainingCount}</div>` : ""}
                </div>
              `,
                )
                .join("")}
            </div>
            <div class="image-count-indicator">
              <i class="fas fa-images"></i> ${imageCount}
            </div>
          </div>
        `
      }
    }

    return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-author">
                        <div class="author-avatar">${authorName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .substring(0, 2)}</div>
                        <div class="author-info">
                            <h4>${authorName}</h4>
                            <span>${postDate}</span>
                        </div>
                    </div>
                </div>
                
                ${imageSection}
                
                <div class="post-content">
                    ${post.titulo ? `<h3 class="post-title">${escapeHtml(post.titulo)}</h3>` : ""}
                    ${post.corpo ? `<p class="post-excerpt">${escapeHtml(post.corpo)}</p>` : ""}
                </div>
                
                <div class="post-actions">
                    <button class="action-btn like-btn liked" data-post-id="${post.id}" onclick="toggleLike(${post.id}, this)">
                        <i class="fas fa-heart"></i>
                        <span class="like-count">${post.total_likes || 0}</span>
                    </button>
                    <button class="action-btn comment-btn" data-post-id="${post.id}" onclick="showCommentsModal(${post.id})">
                        <i class="fas fa-comment"></i>
                        <span class="comment-count">${post.total_comentarios || 0}</span>
                    </button>
                    <span class="post-date">${postDate}</span>
                </div>
            </div>
        `
  }

  function escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  window.openImageModal = (imageSrc, title) => {
    const modal = $(`
      <div class="image-modal" id="image-modal">
        <div class="image-modal-content">
          <span class="image-modal-close">&times;</span>
          <img src="${imageSrc}" alt="${title}" class="modal-image">
          <div class="image-modal-caption">${title}</div>
        </div>
      </div>
    `)

    $("body").append(modal)
    modal.show()
    setTimeout(() => modal.addClass("modal-show"), 10)

    // Close modal events
    modal.find(".image-modal-close").click(() => window.closeImageModal())
    modal.click((e) => {
      if (e.target === modal[0]) window.closeImageModal()
    })
  }

  window.openImageGallery = (postId, startIndex = 0) => {
    // Find the post data to get all images
    const postCard = $(`.post-card[data-post-id="${postId}"]`)
    if (!postCard.length) return

    // For now, open single image modal - can be enhanced to full gallery
    const images = postCard.find(".grid-image img")
    if (images.length > startIndex) {
      const img = images.eq(startIndex)
      window.openImageModal(img.attr("src"), img.attr("alt"))
    }
  }

  window.closeImageModal = () => {
    const modal = $("#image-modal")
    modal.removeClass("modal-show")
    setTimeout(() => modal.remove(), 300)
  }

  // Load initial liked posts
  loadLikedPosts()

  $("#filter-btn").click(() => {
    const start = $("#filter-start").val()
    const end = $("#filter-end").val()

    if (start && end && start > end) {
      showNotification("Data inicial não pode ser maior que data final", "error")
      return
    }

    loadLikedPosts(start, end)
  })

  $(document).on("click", ".clear-filters", () => {
    $("#filter-start").val("")
    $("#filter-end").val("")
    loadLikedPosts()
  })
})

console.log("[v0] Página de curtidas inicializada com sucesso")

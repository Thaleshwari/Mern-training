// ------------------- PRODUCTS -------------------
const products = [
  { id: 1, name: "Wooden Carving", price: 1500, img: "https://i.etsystatic.com/28129679/r/il/23cbce/4738458908/il_fullxfull.4738458908_f26v.jpg" },
  { id: 2, name: "Handmade Jewelry", price: 1200, img: "https://m.media-amazon.com/images/I/71rBTy9TmHL._SX679_.jpg" },
  { id: 3, name: "Custom Painting", price: 2500, img: "https://m.media-amazon.com/images/I/41X-Gk8VvZL._UF1000,1000_QL80_.jpg" }
];

// ------------------- CART STORAGE -------------------
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Save cart
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ------------------- UPDATE CART -------------------
function updateCart() {
  const cartTableBody = document.querySelector("#cartTable tbody");
  const cartTotal = document.getElementById("cartTotal");
  const cartCount = document.getElementById("cartCount");

  if (cartTableBody) cartTableBody.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * (item.quantity || 1);
    total += subtotal;

    if (cartTableBody) {
      cartTableBody.innerHTML += `
        <tr>
          <td>${item.name}</td>
          <td>₹${item.price}</td>
          <td>
            <input type="number" min="1" value="${item.quantity || 1}" 
              onchange="changeQuantity(${index}, this.value)" 
              style="width:60px;text-align:center;">
          </td>
          <td>₹${subtotal}</td>
          <td><button onclick="removeFromCart(${index})">Remove</button></td>
        </tr>
      `;
    }
  });

  if (cartTotal) cartTotal.innerText = total;
  if (cartCount) cartCount.innerText = cart.length;

  saveCart();
}

// ------------------- ADD TO CART -------------------
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (product) {
    // Check if already exists
    const existing = cart.find(item => item.id === id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    updateCart();
    alert("Added to cart!");
  }
}

// ------------------- CHANGE QUANTITY -------------------
function changeQuantity(index, value) {
  const qty = parseInt(value);
  if (qty > 0) {
    cart[index].quantity = qty;
    updateCart();
  }
}

// ------------------- REMOVE FROM CART -------------------
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// ------------------- PRODUCT PAGE -------------------
if (window.location.pathname.includes("product.html")) {
  const params = new URLSearchParams(window.location.search);
  const productId = parseInt(params.get("id"));
  const product = products.find(p => p.id === productId);

  if (product) {
    const container = document.getElementById("productDetails");
    if (container) {
      container.innerHTML = `
        <img src="${product.img}" alt="${product.name}" style="max-width:300px;border-radius:10px;">
        <h2>${product.name}</h2>
        <p>Price: ₹${product.price}</p>
        <button onclick="addToCart(${product.id})" class="btn">Add to Cart</button>
        <a href="checkout.html" class="btn">Buy Now</a>
      `;
    }
  }
}

// ------------------- CART PAGE -------------------
if (window.location.pathname.includes("cart.html")) {
  window.removeFromCart = removeFromCart;
  window.changeQuantity = changeQuantity;
  updateCart();
}

// ------------------- CHECKOUT PAGE -------------------
if (window.location.pathname.includes("checkout.html")) {
  const checkoutTotal = document.getElementById("checkoutTotal");
  const payBtn = document.getElementById("payBtn");
  const paymentStatus = document.getElementById("paymentStatus");

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  if (checkoutTotal) checkoutTotal.innerText = total;

  if (payBtn) {
    payBtn.addEventListener("click", async () => {
      try {
        // Create order via backend
        const res = await fetch("http://localhost:5000/api/payments/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total, currency: "INR" })
        });

        if (!res.ok) throw new Error("Failed to create order. Status: " + res.status);

        const order = await res.json();
        if (!order.id) throw new Error(order.error || "Order creation failed");

        // Razorpay Payment
        const options = {
          key: "rzp_test_RKzPHcE9VGY08b",
          amount: order.amount,
          currency: order.currency,
          name: "CustomCrafter",
          description: "Order Payment",
          order_id: order.id,
          handler: (response) => {
            paymentStatus.innerHTML = `<span style='color:green'>Payment successful! Payment ID: ${response.razorpay_payment_id}</span>`;
            localStorage.removeItem("cart");
          },
          prefill: { name: "", email: "" },
          theme: { color: "#3399cc" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        paymentStatus.innerHTML = `<span style='color:red'>${err.message}</span>`;
        console.error("Razorpay error:", err);
      }
    });
  }
}

// ------------------- INIT -------------------
document.addEventListener("DOMContentLoaded", updateCart);
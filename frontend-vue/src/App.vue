<script setup>
import { computed, onMounted, ref } from "vue";

const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const products = ref([]);
const loading = ref(true);
const error = ref("");
const search = ref("");
const selectedCategory = ref("All");
const cart = ref({});
const cartOpen = ref(false);

const categories = computed(() => [
  "All",
  ...new Set(products.value.map((product) => product.category).filter(Boolean)),
]);
const visibleProducts = computed(() => {
  const query = search.value.trim().toLowerCase();
  return products.value.filter((product) => {
    const matchesCategory = selectedCategory.value === "All" || product.category === selectedCategory.value;
    const matchesSearch = !query || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
});
const cartCount = computed(() => Object.values(cart.value).reduce((total, quantity) => total + quantity, 0));
const cartItems = computed(() => products.value.filter((product) => cart.value[product.pid]).map((product) => ({
  ...product,
  quantity: cart.value[product.pid],
})));
const cartTotal = computed(() => cartItems.value.reduce((total, item) => total + item.festival_price * item.quantity, 0));

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}
function imageFor(product) {
  const name = `${product.name} ${product.category}`.toLowerCase();
  const photos = [
    [/laptop|computer/, "1498049794561-7780e7231661"],
    [/headphone|earbud/, "1505740420928-5e560c06d30e"],
    [/keyboard/, "1517336714731-489689fd1ca8"],
    [/watch/, "1546868871-7041f2a55e12"],
    [/phone|smartphone/, "1511707171634-5f897ff02aa9"],
    [/tablet/, "1544244015-0df4b3ffc6b0"],
    [/camera/, "1516035069371-29a1b244cc32"],
    [/speaker/, "1608043152269-423dbba4e7e1"],
    [/shoe/, "1542291026-7eec264c27ff"],
    [/backpack|bag/, "1553062407-98eeb64c6a62"],
  ];
  const id = photos.find(([pattern]) => pattern.test(name))?.[1] || "1498049794561-7780e7231661";
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
}
function addToCart(product) {
  if (product.stock < 1) return;
  cart.value = { ...cart.value, [product.pid]: Math.min(product.stock, (cart.value[product.pid] || 0) + 1) };
  cartOpen.value = true;
}
function changeQuantity(pid, quantity) {
  const next = { ...cart.value };
  if (quantity < 1) delete next[pid];
  else next[pid] = quantity;
  cart.value = next;
}
async function loadProducts() {
  loading.value = true;
  error.value = "";
  try {
    const response = await fetch(`${apiBase}/products?size=100`);
    if (!response.ok) throw new Error(`The product service returned ${response.status}.`);
    products.value = await response.json();
  } catch {
    error.value = "Could not connect to the NEXORA API. Check that the FastAPI backend is running and VITE_API_URL is correct.";
  } finally {
    loading.value = false;
  }
}
onMounted(loadProducts);
</script>

<template>
  <div class="min-h-screen bg-[#0b1020] text-slate-100">
    <header class="sticky top-0 z-20 border-b border-white/10 bg-[#0b1020]">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="#" class="flex items-center gap-3" aria-label="NEXORA home">
          <span class="grid size-10 place-items-center rounded-xl bg-blue-500 text-lg font-black text-white">N</span>
          <span><span class="block text-lg font-extrabold tracking-[0.18em]">NEXORA</span><span class="block text-[10px] uppercase tracking-[0.22em] text-slate-400">Technology marketplace</span></span>
        </a>
        <div class="flex items-center gap-3">
          <label class="hidden md:block"><span class="sr-only">Search products</span><input v-model="search" class="w-64 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-blue-400" placeholder="Search products..." /></label>
          <button class="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5" @click="cartOpen = !cartOpen" :aria-expanded="cartOpen">Bag <span class="ml-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs">{{ cartCount }}</span></button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <section class="grid gap-8 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
        <div>
          <p class="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-blue-300">Technology, made simple</p>
          <h1 class="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">Good technology.<br /><span class="text-blue-300">Better everyday.</span></h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-slate-400">Discover useful tech and everyday essentials in one simple place.</p>
          <a href="#collection" class="mt-7 inline-flex rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400">Explore collection <span class="ml-2" aria-hidden="true">→</span></a>
        </div>
        <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-slate-900 p-4 sm:p-7">
          <img class="h-56 w-full rounded-2xl object-cover sm:h-72" src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=85" alt="Laptop and everyday technology arranged on a desk" />
          <div class="flex items-center justify-between gap-4 px-1 pt-5"><div><p class="font-semibold">Your everyday essentials</p><p class="mt-1 text-sm text-slate-400">A focused collection, easy to explore.</p></div><span class="rounded-full border border-blue-300/30 px-3 py-1 text-xs text-blue-200">NEXORA</span></div>
        </div>
      </section>

      <section id="collection" class="scroll-mt-24">
        <div class="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div><p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">The collection</p><h2 class="mt-2 text-3xl font-bold tracking-tight">Shop products</h2><p class="mt-2 text-sm text-slate-400">{{ visibleProducts.length }} items to explore</p></div>
          <label class="md:hidden"><span class="sr-only">Search products</span><input v-model="search" class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-blue-400" placeholder="Search products..." /></label>
        </div>

        <nav class="flex gap-2 overflow-x-auto py-5" aria-label="Product categories">
          <button v-for="category in categories" :key="category" class="shrink-0 rounded-full border px-4 py-2 text-sm font-medium" :class="selectedCategory === category ? 'border-blue-400 bg-blue-500 text-white' : 'border-white/10 text-slate-300 hover:bg-white/5'" @click="selectedCategory = category">{{ category }}</button>
        </nav>

        <div v-if="loading" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"><div v-for="n in 8" :key="n" class="h-80 rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div class="h-44 rounded-xl bg-white/5"></div><div class="mt-5 h-4 w-2/3 rounded bg-white/5"></div><div class="mt-3 h-4 w-1/3 rounded bg-white/5"></div></div></div>
        <div v-else-if="error" class="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-8 text-center"><p class="text-sm text-rose-200">{{ error }}</p><button class="mt-4 rounded-xl border border-white/15 px-4 py-2 text-sm" @click="loadProducts">Try again</button></div>
        <div v-else-if="visibleProducts.length" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <article v-for="product in visibleProducts" :key="product.pid" class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            <div class="relative bg-slate-900"><img class="h-52 w-full object-cover" :src="imageFor(product)" :alt="product.name" loading="lazy" /><span class="absolute left-3 top-3 rounded-full bg-[#0b1020]/90 px-3 py-1 text-xs capitalize text-slate-200">{{ product.category }}</span></div>
            <div class="p-4"><h3 class="line-clamp-1 font-semibold">{{ product.name }}</h3><p class="mt-2 min-h-10 text-sm leading-5 text-slate-400">{{ product.description || 'A useful addition to your everyday essentials.' }}</p><div class="mt-4 flex items-center justify-between gap-3"><div><p class="text-lg font-bold">{{ money(product.festival_price ?? product.price) }}</p><p v-if="product.festival_discount_percent > 0" class="text-xs text-slate-500 line-through">{{ money(product.price) }}</p></div><button class="rounded-xl bg-blue-500 px-3 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-700" :disabled="product.stock < 1 || (cart[product.pid] || 0) >= product.stock" @click="addToCart(product)">{{ product.stock < 1 ? 'Out of stock' : 'Add to bag' }}</button></div></div>
          </article>
        </div>
        <div v-else class="rounded-2xl border border-white/10 p-10 text-center"><p class="font-semibold">No products found</p><p class="mt-2 text-sm text-slate-400">Try another search or category.</p><button class="mt-4 text-sm font-semibold text-blue-300" @click="search = ''; selectedCategory = 'All'">Clear filters</button></div>
      </section>
    </main>

    <div v-if="cartOpen" class="fixed inset-0 z-40">
      <button class="absolute inset-0 bg-black/65" aria-label="Close bag" @click="cartOpen = false"></button>
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0f1728] p-5 shadow-2xl sm:p-7" aria-label="Shopping bag">
        <div class="flex items-center justify-between border-b border-white/10 pb-5"><div><h2 class="text-xl font-bold">Your bag</h2><p class="mt-1 text-sm text-slate-400">{{ cartCount }} items</p></div><button class="rounded-lg border border-white/15 px-3 py-2 text-sm" @click="cartOpen = false">Close</button></div>
        <div v-if="!cartItems.length" class="grid flex-1 place-items-center text-center"><div><p class="font-semibold">Your bag is empty</p><p class="mt-2 text-sm text-slate-400">Add something from the collection.</p></div></div>
        <div v-else class="flex-1 divide-y divide-white/10 overflow-y-auto">
          <div v-for="item in cartItems" :key="item.pid" class="flex gap-4 py-4"><img class="size-20 rounded-xl object-cover" :src="imageFor(item)" :alt="item.name" /><div class="min-w-0 flex-1"><p class="font-semibold">{{ item.name }}</p><p class="mt-1 text-sm text-slate-400">{{ money(item.festival_price) }}</p><div class="mt-3 flex items-center gap-3"><button class="rounded border border-white/15 px-2" :aria-label="'Decrease ' + item.name" @click="changeQuantity(item.pid, item.quantity - 1)">−</button><span class="text-sm">{{ item.quantity }}</span><button class="rounded border border-white/15 px-2" :aria-label="'Increase ' + item.name" :disabled="item.quantity >= item.stock" @click="changeQuantity(item.pid, item.quantity + 1)">+</button><button class="ml-auto text-xs text-slate-400 underline" @click="changeQuantity(item.pid, 0)">Remove</button></div></div></div>
        </div>
        <div v-if="cartItems.length" class="border-t border-white/10 pt-5"><div class="flex justify-between text-sm"><span class="text-slate-400">Subtotal</span><strong>{{ money(cartTotal) }}</strong></div><p class="mt-3 text-xs leading-5 text-slate-500">This simplified frontend keeps the bag in the current session. Sign-in and checkout are not included in this first version.</p></div>
      </aside>
    </div>

    <footer class="border-t border-white/10"><div class="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"><span class="font-bold tracking-[0.2em] text-slate-300">NEXORA</span><span>Simple shopping for everyday technology.</span><span>© 2026 NEXORA</span></div></footer>
  </div>
</template>

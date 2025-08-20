import { useState, useEffect } from "react";
import { Search, Plus, Sun, Moon, Home, User, MapPin, LogIn, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

// 🔥 Замени на свой config из Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: "", price: "", location: "Москва", image: "", lat: 55.7558, lng: 37.6173 });
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [mapUrl, setMapUrl] = useState("");

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUser(user));
    const unsubscribePosts = onSnapshot(collection(db, "posts"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(list);
    });

    return () => {
      unsubscribe();
      unsubscribePosts();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Ошибка входа: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert("Ошибка выхода: " + error.message);
    }
  };

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.price || !user) return alert("Заполните название и цену");
    try {
      await addDoc(collection(db, "posts"), {
        ...newPost,
        userId: user.uid,
        userName: user.displayName || user.email.split("@")[0],
        userPhoto: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || "User"}`,
        createdAt: serverTimestamp(),
      });
      setNewPost({ title: "", price: "", location: "Москва", image: "", lat: 55.7558, lng: 37.6173 });
      setShowModal(false);
    } catch (error) {
      alert("Ошибка публикации: " + error.message);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openMap = (lat, lng, title) => {
    setMapUrl(`https://yandex.ru/maps/?ll=${lng},${lat}&z=15&text=${encodeURIComponent(title)}`);
    document.getElementById("mapModal").style.display = "flex";
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <header className={`px-4 py-3 flex items-center justify-between border-b ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">InstaBoard</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            {darkMode ? <Sun className="text-yellow-300" size={20} /> : <Moon size={20} />}
          </button>
          {!user ? (
            <button onClick={handleLogin} className="flex items-center gap-1 text-sm font-medium text-blue-500">
              <LogIn size={16} /> Войти
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || "U"}`} alt="avatar" className="w-8 h-8 rounded-full" />
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <Search className="text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Поиск по названию или локации..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`bg-transparent w-full outline-none ${darkMode ? "placeholder-gray-400" : "placeholder-gray-500"}`}
        />
      </div>

      <main className="p-4 pb-20">
        {user ? (
          <AnimatePresence>
            {filteredPosts.length > 0 ? (
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
                {filteredPosts.map((post) => (
                  <motion.div key={post.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className={`rounded-2xl overflow-hidden shadow-md transition-all hover:shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <div className="h-48 overflow-hidden">
                      <img src={post.image || "https://placehold.co/600x400/gray/white?text=Фото"} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <img src={post.userPhoto} alt="user" className="w-6 h-6 rounded-full" />
                        <span>{post.userName}</span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{post.price}</p>
                      <button onClick={() => openMap(post.lat, post.lng, post.location)} className="flex items-center gap-1 text-xs text-blue-500 mt-1">
                        <MapPin size={12} /> {post.location}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">Нет объявлений</div>
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p>Войдите через Google, чтобы просматривать и публиковать объявления</p>
            <button onClick={handleLogin} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full flex items-center gap-2 mx-auto">
              <LogIn size={16} /> Войти через Google
            </button>
          </div>
        )}
      </main>

      {user && (
        <button onClick={() => setShowModal(true)} className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-10">
          <Plus size={24} />
        </button>
      )}

      <nav className={`fixed bottom-0 left-0 right-0 flex justify-around items-center py-3 px-4 ${darkMode ? "bg-gray-800 border-t border-gray-700" : "bg-white border-t border-gray-200"}`}>
        <button className="flex flex-col items-center gap-1 text-xs text-purple-500">
          <Home size={20} />
          <span>Главная</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-xs text-gray-400">
          <User size={20} />
          <span>Профиль</span>
        </button>
      </nav>

      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-2xl p-6 w-full max-w-md ${darkMode ? "bg-gray-800" : "bg-white"} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Новое объявление</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Название" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`} />
              <input type="text" placeholder="Цена" value={newPost.price} onChange={(e) => setNewPost({ ...newPost, price: e.target.value })} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`} />
              <input type="text" placeholder="Местоположение" value={newPost.location} onChange={(e) => setNewPost({ ...newPost, location: e.target.value })} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`} />
              <input type="text" placeholder="Ссылка на фото" value={newPost.image} onChange={(e) => setNewPost({ ...newPost, image: e.target.value })} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Отмена</button>
              <button onClick={handleAddPost} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90">Опубликовать</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div id="mapModal" style={{ display: "none" }} className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl max-w-md w-full">
          <h4 className="font-bold mb-4">Местоположение</h4>
          <iframe src={mapUrl} className="w-full h-60 border-0 rounded-xl" title="Карта"></iframe>
          <button onClick={() => document.getElementById("mapModal").style.display = "none"} className="w-full mt-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl">Закрыть</button>
        </div>
      </div>
    </div>
  );
}

const firebaseConfig = {
    apiKey: "AIzaSyAXlEha6cyLALeVfE7Uhlh3cqU1yFpdDlQ",
    authDomain: "student-app-939d7.firebaseapp.com",
    databaseURL: "https://student-app-939d7-default-rtdb.firebaseio.com",
    projectId: "student-app-939d7",
    storageBucket: "student-app-939d7.appspot.com",
    messagingSenderId: "614984408185",
    appId: "1:614984408185:web:1f402a120ff92421fb08a8"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();
let currentUser = null;
let studentData = {};

document.addEventListener('DOMContentLoaded', applyInitialTheme);

auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        database.ref('students/' + user.uid).once('value', snapshot => {
            studentData = snapshot.val();
            if (studentData) {
                studentData.isPaid = studentData.isPaidUser || false;
                renderApp();
            } else {
                auth.signOut();
            }
        });
    } else {
        currentUser = null;
        studentData = {};
        showAuthPage();
    }
});

// --- UI & Event Listeners ---
function setupAppEventListeners() {
    document.getElementById('menu-button').addEventListener('click', toggleSidebar);
    document.getElementById('overlay').addEventListener('click', toggleSidebar);
    document.getElementById('modal-overlay').addEventListener('click', hideModal);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

// --- AUTHENTICATION (No changes) ---
function showAuthPage() {
    document.getElementById('app-container').innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-teal-400 p-4">
            <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <div class="text-center mb-8"><i class="fas fa-book-open text-blue-500 text-5xl mb-4"></i><h2 class="text-3xl font-bold text-gray-800">Welcome!</h2></div>
                <form id="login-form"><h3 class="text-xl font-semibold text-gray-700 mb-4 text-center">Login</h3><div class="space-y-4"><input type="email" id="loginEmail" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 transition" required><input type="password" id="loginPassword" placeholder="Password" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 transition" required></div><button type="submit" class="w-full mt-6 gradient-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">Login</button><p class="text-center mt-4 text-sm text-gray-700">No account? <button type="button" class="font-semibold text-blue-600 hover:underline" onclick="toggleAuthView()">Register</button></p></form>
                <form id="register-form" class="hidden"><h3 class="text-xl font-semibold text-gray-700 mb-4 text-center">Create Account</h3><div class="space-y-4"><input type="text" id="regFullName" placeholder="Full Name" class="w-full p-3 border border-gray-300 rounded-lg" required><select id="regClass" class="w-full p-3 border border-gray-300 rounded-lg" required><option value="">Select Class</option>${[...Array(10).keys()].map(i => `<option value="${i+1}th">${i+1}th</option>`).join('')}</select><select id="regMedium" class="w-full p-3 border border-gray-300 rounded-lg" required><option value="">Select Medium</option><option value="English">English</option><option value="Marathi">Marathi</option><option value="Semi-English">Semi-English</option></select><input type="email" id="regEmail" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-lg" required><input type="password" id="regPassword" placeholder="Password" class="w-full p-3 border border-gray-300 rounded-lg" required></div><button type="submit" class="w-full mt-6 gradient-success text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg">Register</button><p class="text-center mt-4 text-sm text-gray-700">Have an account? <button type="button" class="font-semibold text-blue-600 hover:underline" onclick="toggleAuthView()">Login</button></p></form>
                <p id="auth-error" class="text-red-600 text-sm mt-4 hidden text-center"></p>
            </div>
        </div>`;
    setupEmailAuth();
}
function toggleAuthView() { document.getElementById('login-form').classList.toggle('hidden'); document.getElementById('register-form').classList.toggle('hidden'); document.getElementById('auth-error').classList.add('hidden'); }
function setupEmailAuth() { const l=document.getElementById('login-form'),r=document.getElementById('register-form'),e=document.getElementById('auth-error');l.addEventListener('submit',async t=>{t.preventDefault();try{await auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value,document.getElementById('loginPassword').value)}catch(c){e.textContent="Invalid email or password.",e.classList.remove('hidden')}}),r.addEventListener('submit',async t=>{t.preventDefault();try{const c=await auth.createUserWithEmailAndPassword(document.getElementById('regEmail').value,document.getElementById('regPassword').value),n=c.user;await database.ref('students/'+n.uid).set({uid:n.uid,email:n.email,fullName:document.getElementById('regFullName').value,class:document.getElementById('regClass').value,medium:document.getElementById('regMedium').value,isPaidUser:!1,createdAt:firebase.database.ServerValue.TIMESTAMP})}catch(c){e.textContent=c.message,e.classList.remove('hidden')}})}
function logout() { auth.signOut(); }

// --- UI RENDERING & PAGE NAVIGATION ---
function renderApp() {
    document.getElementById('app-container').innerHTML = `
        <header class="fixed top-0 left-0 right-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 flex justify-between items-center max-w-md mx-auto w-full border-b border-gray-200 dark:border-slate-700 transition-colors">
            <button id="menu-button" class="text-2xl text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"><i class="fas fa-bars"></i></button>
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">LearnApp</h1>
            <div class="w-8"></div>
        </header>
        <main id="main-content" class="flex-grow p-4 pt-20 pb-24 overflow-y-auto w-full"></main>
        <nav class="fixed bottom-0 left-0 right-0 z-10 p-3 flex justify-around items-center max-w-md mx-auto bottom-nav">
            <button class="nav-item flex flex-col items-center" onclick="showPage('home')"><i class="fas fa-home text-2xl"></i><span class="text-xs mt-1 font-semibold">Home</span></button>
            <button class="nav-item flex flex-col items-center" onclick="showPage('subjects')"><i class="fas fa-book text-2xl"></i><span class="text-xs mt-1 font-semibold">Subjects</span></button>
            <button class="nav-item flex flex-col items-center" onclick="showPage('profile')"><i class="fas fa-user-circle text-2xl"></i><span class="text-xs mt-1 font-semibold">Profile</span></button>
        </nav>`;
    document.getElementById('sidebar-student-name').textContent = studentData.fullName || 'Student';
    document.getElementById('sidebar-student-class').textContent = `Class: ${studentData.class || '-'}`;
    setupAppEventListeners();
    showPage('home');
}

async function showPage(page, data = null) {
    const content = document.getElementById('main-content');
    if (!content) return;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNavItem = document.querySelector(`.nav-item[onclick*="'${page}'"]`);
    if (activeNavItem) activeNavItem.classList.add('active');

    switch (page) {
        case 'home':
            content.innerHTML = `
                <div class="p-4 bg-gradient-to-r from-blue-100 to-teal-50 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-md mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Hello, ${studentData.fullName.split(' ')[0]}!</h2>
                    <p class="text-gray-600 dark:text-gray-300">Ready to learn something new today?</p>
                </div>
                <div id="continue-learning"></div>
                <div class="mt-6">
                     <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Quote of the Day</h3>
                     <div class="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                        <p class="text-center italic text-gray-600 dark:text-gray-300">"The beautiful thing about learning is that no one can take it away from you."</p>
                        <p class="text-center font-semibold text-sm mt-2 text-gray-700 dark:text-gray-200">- B.B. King</p>
                    </div>
                </div>`;
            renderContinueLearning();
            break;
        case 'subjects':
            content.innerHTML = `<h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">My Subjects</h2><div id="subjects-list" class="space-y-4"></div>`;
            fetchSubjects();
            break;
        case 'lessons':
            const { subjectId, subjectName, subjectColor } = data;
            content.innerHTML = `<div class="flex items-center mb-4"><button onclick="showPage('subjects')" class="text-blue-500 hover:text-blue-700 p-2 mr-2"><i class="fas fa-arrow-left text-xl"></i></button><div class="subject-icon mr-3" style="background-color:${subjectColor||'#3B82F6'};width:40px;height:40px;font-size:20px;"><i class="fas fa-book text-white"></i></div><h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">${subjectName}</h2></div><div id="lessons-list" class="space-y-3"></div>`;
            fetchLessons(data);
            break;
        case 'lesson':
             // FIX: Add a loading skeleton immediately
             content.innerHTML = `
                <div>
                    <div class="flex items-center mb-4">
                        <div class="h-9 w-9 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
                        <div class="h-8 w-3/5 bg-gray-200 dark:bg-slate-700 rounded-md ml-4 animate-pulse"></div>
                    </div>
                    <div class="flex space-x-2 mb-4">
                        <div class="h-12 w-1/2 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                        <div class="h-12 w-1/2 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    </div>
                    <div class="h-64 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                </div>`;
             fetchLessonDetail(data);
             break;
        case 'profile':
            content.innerHTML = `<div><h2 class="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">My Profile</h2><div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-4"><div class="flex items-center"><i class="fas fa-user w-6 text-gray-500 dark:text-gray-400"></i><p><strong class="font-semibold text-gray-600 dark:text-gray-300">Name:</strong> ${studentData.fullName}</p></div><div class="flex items-center"><i class="fas fa-envelope w-6 text-gray-500 dark:text-gray-400"></i><p><strong class="font-semibold text-gray-600 dark:text-gray-300">Email:</strong> ${studentData.email}</p></div><div class="flex items-center"><i class="fas fa-graduation-cap w-6 text-gray-500 dark:text-gray-400"></i><p><strong class="font-semibold text-gray-600 dark:text-gray-300">Class:</strong> ${studentData.class}</p></div><div class="flex items-center"><i class="fas fa-certificate w-6 text-gray-500 dark:text-gray-400"></i><p><strong class="font-semibold text-gray-600 dark:text-gray-300">Status:</strong> <span class="font-bold py-1 px-3 rounded-full text-sm ${studentData.isPaid ? 'bg-green-100 text-green-600':'bg-orange-100 text-orange-500'}">${studentData.isPaid ? 'Premium User':'Free User'}</span></p></div><button onclick="logout()" class="w-full mt-6 gradient-danger text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">Logout</button></div></div>`;
            break;
    }
}

// --- DATA FETCHING & DISPLAY ---
function fetchSubjects() {
    const listEl = document.getElementById('subjects-list');
    listEl.innerHTML = `<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`; // Skeleton loader
    const path = `subjects/${studentData.class}/${studentData.medium}`;
    database.ref(path).once('value', snapshot => {
        listEl.innerHTML = ''; // Clear skeleton
        if (snapshot.exists()) {
            const subjects = snapshot.val();
            listEl.innerHTML = Object.keys(subjects).map(id => {
                const subject = subjects[id];
                // Use JSON.stringify to safely pass the data object in the onclick handler
                const subjectData = JSON.stringify({ subjectId: id, subjectName: subject.name, subjectColor: subject.color });
                return `<div class="subject-card" onclick='showPage("lessons", ${subjectData})'><div class="subject-icon mr-4" style="background-color: ${subject.color || '#3B82F6'}"><i class="fas ${subject.icon || 'fa-book'}"></i></div><div class="flex-grow"><h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">${subject.name}</h3><p class="text-sm text-gray-500 dark:text-gray-400">${subject.chapterCount || '0'} Chapters</p></div><i class="fas fa-chevron-right text-gray-400"></i></div>`;
            }).join('');
        } else {
            listEl.innerHTML = `<p class="text-center text-gray-500">No subjects found.</p>`;
        }
    });
}
function fetchLessons(data) {
    const { subjectId, subjectName, subjectColor } = data;
    const listEl = document.getElementById('lessons-list');
    const path = `lessons/${studentData.class}/${studentData.medium}/${subjectId}`;
    database.ref(path).orderByChild('title').once('value', snapshot => {
        if (snapshot.exists()) {
            const lessons = snapshot.val();
            listEl.innerHTML = Object.keys(lessons).map((id, index) => {
                const lesson = lessons[id];
                // FIX: Pass all required data to the lesson page safely using JSON.stringify
                const lessonData = JSON.stringify({ lessonId: id, subjectId, lessonTitle: lesson.title, subjectName, subjectColor });
                return `<div class="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow" onclick='showPage("lesson", ${lessonData})'><div class="flex justify-between items-center"><h3 class="text-md font-semibold text-gray-700 dark:text-gray-200">${index+1}. ${lesson.title}</h3><div class="flex items-center">${lesson.isPaid ? '<span class="text-xs font-bold text-white bg-orange-500 px-2 py-1 rounded-full mr-3">PREMIUM</span>' : ''}<i class="fas fa-arrow-right text-blue-500"></i></div></div></div>`;
            }).join('');
        } else {
            listEl.innerHTML = `<p class="text-center text-gray-500">No lessons found.</p>`;
        }
    });
}
function fetchLessonDetail(data) {
    const { lessonId, subjectId, subjectName, subjectColor } = data;
    const contentEl = document.getElementById('main-content');
    const path = `lessons/${studentData.class}/${studentData.medium}/${subjectId}/${lessonId}`;

    database.ref(path).once('value', snapshot => {
        if (snapshot.exists()) {
            const lesson = snapshot.val();
            saveRecentLesson(lessonId, subjectId, lesson.title);

            const isLocked = lesson.isPaid && !studentData.isPaid;
            // FIX: Safely stringify data for the back button
            const backButtonData = JSON.stringify({ subjectId, subjectName, subjectColor });

            // Set main structure
            contentEl.innerHTML = `
                <div>
                    <div class="flex items-center mb-4">
                        <button onclick='showPage("lessons", ${backButtonData})' class="text-blue-500 hover:text-blue-700 p-2">
                            <i class="fas fa-arrow-left text-xl"></i>
                        </button>
                        <h2 class="text-2xl font-bold ml-2 text-gray-800 dark:text-gray-100">${lesson.title}</h2>
                    </div>
                    <div class="flex space-x-2 mb-4">
                        <button id="read-btn" class="flex-1 font-bold py-3 px-4 rounded-lg shadow-sm">Read</button>
                        <button id="qna-btn" class="flex-1 font-bold py-3 px-4 rounded-lg">Q&A</button>
                    </div>
                    <div id="lesson-content-area" class="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-inner prose max-w-none dark:prose-invert"></div>
                </div>`;

            // --- START: Unminified and corrected logic for Read/Q&A tabs ---
            const readBtn = document.getElementById("read-btn");
            const qnaBtn = document.getElementById("qna-btn");
            const lessonContentArea = document.getElementById("lesson-content-area");

            const setActiveTab = (activeBtn) => {
                [readBtn, qnaBtn].forEach(btn => {
                    btn.classList.remove("gradient-primary", "text-white");
                    btn.classList.add("bg-gray-200", "dark:bg-slate-700", "hover:bg-gray-300", "text-gray-800", "dark:text-gray-200");
                });
                activeBtn.classList.add("gradient-primary", "text-white");
                activeBtn.classList.remove("bg-gray-200", "dark:bg-slate-700", "hover:bg-gray-300", "text-gray-800", "dark:text-gray-200");
            };

            const showReadContent = () => {
                setActiveTab(readBtn);
                let contentHTML = isLocked
                    ? `<div class="prose max-w-none dark:prose-invert">${lesson.freeContent || "This is a preview."}</div><div class="mt-6 p-4 bg-blue-50 dark:bg-slate-700 border-l-4 border-blue-500 rounded-r-lg text-center"><p class="font-bold text-blue-800 dark:text-blue-300">This is a premium lesson!</p><p class="text-blue-700 dark:text-blue-400">Upgrade to view full content.</p></div>`
                    : `<div class="prose max-w-none dark:prose-invert">${lesson.fullContent || "No content available."}</div>`;
                lessonContentArea.innerHTML = contentHTML.replace(/\n/g, '<br>');
            };

            const showQnaContent = () => {
                setActiveTab(qnaBtn);
                lessonContentArea.innerHTML = (lesson.qna && Array.isArray(lesson.qna) && lesson.qna.length > 0)
                    ? lesson.qna.map(item =>
                        `<div class="border dark:border-slate-700 rounded-lg mb-2">
                            <div class="p-3 font-semibold cursor-pointer flex justify-between items-center" onclick="toggleAnswer(this)">
                                <span>${item.question}</span>
                                <i class="fas fa-chevron-down transition-transform"></i>
                            </div>
                            <div class="qna-answer hidden p-3 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-gray-300">${item.answer}</div>
                        </div>`
                    ).join("")
                    : '<p class="text-center text-gray-500">No Q&A available for this lesson.</p>';
            };

            readBtn.addEventListener("click", showReadContent);
            qnaBtn.addEventListener("click", showQnaContent);

            // Show the read content by default
            showReadContent();
            // --- END: Unminified logic ---

        } else {
            // FIX: Add an error message if the lesson is not found
            console.error("Lesson not found at path:", path);
            contentEl.innerHTML = `
                <div class="p-4 text-center">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <h2 class="text-xl font-bold text-red-500">Error Loading Lesson</h2>
                    <p class="text-gray-600 dark:text-gray-400">Could not find the lesson data. It might have been moved or deleted.</p>
                    <button onclick="showPage('subjects')" class="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">Go Back to Subjects</button>
                </div>`;
        }
    });
}
function toggleAnswer(element) { element.nextElementSibling.classList.toggle('hidden'); element.querySelector('i').classList.toggle('rotate-180'); }

// --- Home Screen Features ---
function saveRecentLesson(lessonId, subjectId, lessonTitle) {
    let recents = JSON.parse(localStorage.getItem('recentLessons')) || [];
    recents = recents.filter(item => item.lessonId !== lessonId); // Remove duplicates
    recents.unshift({ lessonId, subjectId, lessonTitle, time: new Date().getTime() });
    if (recents.length > 3) recents.pop(); // Keep only last 3
    localStorage.setItem('recentLessons', JSON.stringify(recents));
}
function renderContinueLearning() {
    const recents = JSON.parse(localStorage.getItem('recentLessons')) || [];
    const container = document.getElementById('continue-learning');
    if (recents.length > 0) {
        let html = `<h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Continue Learning</h3><div class="space-y-3">`;
        recents.forEach(item => {
             // FIX: Need to fetch subject details to pass to the lesson page again
            const lessonData = JSON.stringify({ lessonId: item.lessonId, subjectId: item.subjectId });
            html += `<div class="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center justify-between cursor-pointer" onclick='showPage("lesson", ${lessonData})'><div><p class="font-semibold text-gray-700 dark:text-gray-200">${item.lessonTitle}</p><p class="text-sm text-gray-500 dark:text-gray-400">Tap to resume</p></div><i class="fas fa-play-circle text-2xl text-blue-500"></i></div>`;
        });
        html += `</div>`;
        container.innerHTML = html;
    }
}

// --- MODAL & THEME LOGIC ---
function showModal(type) {
    const modal = document.getElementById('modal-container');
    const content = document.getElementById('modal-content');
    let html = '';
    switch(type) {
        case 'theme':
            html = `<h3 class="font-bold text-xl mb-4 text-center">Select Theme</h3><div class="flex justify-around"><button onclick="setTheme('light')" class="text-center p-4 rounded-lg border-2 border-gray-200 dark:border-slate-600"><i class="fas fa-sun text-4xl text-yellow-500"></i><p class="mt-2 font-semibold">Light</p></button><button onclick="setTheme('dark')" class="text-center p-4 rounded-lg border-2 border-gray-200 dark:border-slate-600"><i class="fas fa-moon text-4xl text-indigo-500"></i><p class="mt-2 font-semibold">Dark</p></button></div>`;
            break;
        case 'share':
            html = `<h3 class="font-bold text-xl mb-4 text-center">Share the App</h3><p class="text-center text-gray-600 dark:text-gray-300 mb-4">Share this app with your friends!</p><div class="flex items-center border rounded-lg p-2 bg-gray-100 dark:bg-slate-700"><input type="text" value="${window.location.href}" class="bg-transparent border-0 flex-1" readonly><button onclick="navigator.clipboard.writeText(window.location.href)" class="bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-semibold">Copy</button></div>`;
            break;
        case 'rate':
             html = `<h3 class="font-bold text-xl mb-4 text-center">Rate Us</h3><p class="text-center text-gray-600 dark:text-gray-300 mb-4">If you enjoy the app, please rate us!</p><div class="flex justify-center text-3xl text-yellow-400 space-x-2"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="far fa-star"></i></div>`;
            break;
        case 'privacy':
             html = `<h3 class="font-bold text-xl mb-4">Privacy Policy</h3><p class="text-sm text-gray-600 dark:text-gray-300">Your data is safe with us. We do not share any personal information with third parties. All user data is securely stored and is used solely for the purpose of improving your learning experience within the app.</p>`;
             break;
        case 'settings':
             html = `<h3 class="font-bold text-xl mb-4">Settings</h3><div class="flex justify-between items-center"><p>Clear Recent Lessons</p><button onclick="localStorage.removeItem('recentLessons'); hideModal(); showPage('home');" class="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-md">Clear</button></div>`;
             break;
    }
    content.innerHTML = html;
    modal.classList.add('flex');
    setTimeout(() => content.classList.add('open'), 10);
    toggleSidebar();
}
function hideModal() {
    const modal = document.getElementById('modal-container');
    const content = document.getElementById('modal-content');
    content.classList.remove('open');
    setTimeout(() => modal.classList.remove('flex'), 300);
}
function applyInitialTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
}
function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyInitialTheme();
    hideModal();
}

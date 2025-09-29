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
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

// --- AUTHENTICATION & REGISTRATION ---
function showAuthPage() {
    document.getElementById('app-container').innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-teal-400 p-4">
            <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
                <div class="text-center mb-8">
                    <i class="fas fa-book-open text-blue-500 text-5xl mb-4"></i>
                    <h2 class="text-3xl font-bold text-gray-800">Welcome to LearnApp!</h2>
                </div>
                <form id="login-form">
                    <h3 class="text-xl font-semibold text-gray-700 mb-4 text-center">Login</h3>
                    <div class="space-y-4">
                        <input type="email" id="loginEmail" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 transition" required>
                        <input type="password" id="loginPassword" placeholder="Password" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 transition" required>
                    </div>
                    <button type="submit" class="w-full mt-6 gradient-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">Login</button>
                    <p class="text-center mt-4 text-sm">No account? <button type="button" class="font-semibold text-blue-600 hover:underline" onclick="toggleAuthView()">Register here</button></p>
                </form>
                <form id="register-form" class="hidden">
                    <h3 class="text-xl font-semibold text-gray-700 mb-4 text-center">Create Account</h3>
                     <div class="space-y-4">
                        <input type="text" id="regFullName" placeholder="Full Name" class="w-full p-3 border border-gray-300 rounded-lg" required>
                        <select id="regClass" class="w-full p-3 border border-gray-300 rounded-lg" required>
                            <option value="">Select Class</option>
                            ${[...Array(10).keys()].map(i => `<option value="${i+1}th">${i+1}th</option>`).join('')}
                        </select>
                        <select id="regMedium" class="w-full p-3 border border-gray-300 rounded-lg" required>
                            <option value="">Select Medium</option>
                            <option value="English">English</option>
                            <option value="Marathi">Marathi</option>
                            <option value="Semi-English">Semi-English</option>
                        </select>
                        <input type="email" id="regEmail" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-lg" required>
                        <input type="password" id="regPassword" placeholder="Password" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    </div>
                    <button type="submit" class="w-full mt-6 gradient-success text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg">Register</button>
                    <p class="text-center mt-4 text-sm">Already have an account? <button type="button" class="font-semibold text-blue-600 hover:underline" onclick="toggleAuthView()">Login here</button></p>
                </form>
                <p id="auth-error" class="text-red-600 text-sm mt-4 hidden text-center"></p>
            </div>
        </div>`;
    setupEmailAuth();
}

function toggleAuthView() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('register-form').classList.toggle('hidden');
    document.getElementById('auth-error').classList.add('hidden');
}

function setupEmailAuth() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authError = document.getElementById('auth-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
        } catch (error) {
            authError.textContent = "Invalid email or password.";
            authError.classList.remove('hidden');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(document.getElementById('regEmail').value, document.getElementById('regPassword').value);
            const user = userCredential.user;

            const newStudentData = {
                uid: user.uid,
                email: user.email,
                fullName: document.getElementById('regFullName').value,
                class: document.getElementById('regClass').value,
                medium: document.getElementById('regMedium').value,
                isPaidUser: false,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };
            await database.ref('students/' + user.uid).set(newStudentData);
        } catch (error) {
            authError.textContent = error.message;
            authError.classList.remove('hidden');
        }
    });
}

function logout() {
    auth.signOut();
}

// --- UI RENDERING & PAGE NAVIGATION ---

function renderApp() {
    document.getElementById('app-container').innerHTML = `
        <header class="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center max-w-md mx-auto w-full border-b border-gray-200">
            <button id="menu-button" class="text-2xl text-gray-600 hover:text-blue-500 transition-colors"><i class="fas fa-bars"></i></button>
            <h1 class="text-xl font-bold text-gray-800">LearnApp</h1>
            <div class="w-8"></div> </header>
        <main id="main-content" class="flex-grow p-4 pt-20 pb-24 overflow-y-auto w-full"></main>
        <nav class="fixed bottom-0 left-0 right-0 z-10 bg-white p-3 flex justify-around items-center max-w-md mx-auto bottom-nav">
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
    content.innerHTML = '<div class="text-center p-10"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>';

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNavItem = document.querySelector(`.nav-item[onclick*="'${page}'"]`);
    if (activeNavItem) activeNavItem.classList.add('active');

    switch (page) {
        case 'home':
        case 'subjects':
            content.innerHTML = `
                <div class="p-4 bg-gradient-to-r from-blue-100 to-teal-50 rounded-xl shadow-md mb-6 fade-in">
                    <h2 class="text-2xl font-bold text-gray-800">Welcome, ${studentData.fullName.split(' ')[0]}!</h2>
                    <p class="text-gray-600">Subjects for Class ${studentData.class} (${studentData.medium})</p>
                </div>
                <h2 class="text-2xl font-bold mb-4 text-gray-800">My Subjects</h2>
                <div id="subjects-list" class="space-y-4"></div>`;
            fetchSubjects();
            break;
        
        case 'lessons':
            const { subjectId, subjectName, subjectColor } = data;
            content.innerHTML = `
                <div class="flex items-center mb-4 fade-in">
                    <button onclick="showPage('subjects')" class="text-blue-500 hover:text-blue-700 p-2 mr-2"><i class="fas fa-arrow-left text-xl"></i></button>
                    <div class="subject-icon mr-3" style="background-color: ${subjectColor || '#3B82F6'}; width: 40px; height: 40px; font-size: 20px;">
                        <i class="fas fa-book text-white"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800">${subjectName}</h2>
                </div>
                <div id="lessons-list" class="space-y-3"></div>`;
            fetchLessons(subjectId);
            break;
        
        case 'lesson':
             const { lessonId, subjectId: sId } = data;
             fetchLessonDetail(lessonId, sId);
             break;

        case 'profile':
            content.innerHTML = `
                <div class="fade-in">
                    <h2 class="text-3xl font-bold mb-6 text-gray-800">My Profile</h2>
                    <div class="bg-white p-6 rounded-xl shadow-lg space-y-4">
                        <div class="flex items-center"><i class="fas fa-user w-6 text-gray-500"></i><p><strong class="font-semibold text-gray-600">Name:</strong> ${studentData.fullName}</p></div>
                        <div class="flex items-center"><i class="fas fa-envelope w-6 text-gray-500"></i><p><strong class="font-semibold text-gray-600">Email:</strong> ${studentData.email}</p></div>
                        <div class="flex items-center"><i class="fas fa-graduation-cap w-6 text-gray-500"></i><p><strong class="font-semibold text-gray-600">Class:</strong> ${studentData.class}</p></div>
                        <div class="flex items-center"><i class="fas fa-certificate w-6 text-gray-500"></i><p><strong class="font-semibold text-gray-600">Status:</strong> <span class="font-bold py-1 px-3 rounded-full text-sm ${studentData.isPaid ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}">${studentData.isPaid ? 'Premium User' : 'Free User'}</span></p></div>
                        <button onclick="logout()" class="w-full mt-6 gradient-danger text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">Logout</button>
                    </div>
                </div>`;
            break;
        default:
            content.innerHTML = `<p class="text-center text-gray-500 mt-10">Page not found.</p>`;
    }
}

// --- DATA FETCHING AND DISPLAY ---

function fetchSubjects() {
    const listEl = document.getElementById('subjects-list');
    const path = `subjects/${studentData.class}/${studentData.medium}`;
    database.ref(path).once('value', snapshot => {
        if (snapshot.exists()) {
            const subjects = snapshot.val();
            let delay = 0;
            listEl.innerHTML = Object.keys(subjects).map(id => {
                const subject = subjects[id];
                const cardHtml = `
                    <div class="subject-card fade-in" style="animation-delay: ${delay += 100}ms"
                         onclick="showPage('lessons', { subjectId: '${id}', subjectName: '${subject.name}', subjectColor: '${subject.color}' })">
                        <div class="subject-icon mr-4" style="background-color: ${subject.color || '#3B82F6'}">
                            <i class="fas ${subject.icon || 'fa-book'}"></i>
                        </div>
                        <div class="flex-grow">
                            <h3 class="text-lg font-bold text-gray-800">${subject.name}</h3>
                            <p class="text-sm text-gray-500">${subject.chapterCount || '0'} Chapters</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>`;
                return cardHtml;
            }).join('');
        } else {
            listEl.innerHTML = `<p class="text-center text-gray-500 mt-10">No subjects found for your class and medium.</p>`;
        }
    });
}

function fetchLessons(subjectId) {
    const listEl = document.getElementById('lessons-list');
    const path = `lessons/${studentData.class}/${studentData.medium}/${subjectId}`;
    
    database.ref(path).orderByChild('title').once('value', snapshot => {
        if (snapshot.exists()) {
            const lessons = snapshot.val();
            let delay = 0;
            listEl.innerHTML = Object.keys(lessons).map((id, index) => {
                const lesson = lessons[id];
                return `
                <div class="bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow fade-in" style="animation-delay: ${delay += 50}ms"
                     onclick="showPage('lesson', { lessonId: '${id}', subjectId: '${subjectId}' })">
                    <div class="flex justify-between items-center">
                        <h3 class="text-md font-semibold text-gray-700">${index + 1}. ${lesson.title}</h3>
                        <div class="flex items-center">
                           ${lesson.isPaid ? '<span class="text-xs font-bold text-white bg-orange-500 px-2 py-1 rounded-full mr-3">PREMIUM</span>' : ''}
                           <i class="fas fa-arrow-right text-blue-500"></i>
                        </div>
                    </div>
                </div>`
            }).join('');
        } else {
            listEl.innerHTML = `<p class="text-center text-gray-500">No lessons found for this subject.</p>`;
        }
    });
}


function fetchLessonDetail(lessonId, subjectId) {
    const contentEl = document.getElementById('main-content');
    const path = `lessons/${studentData.class}/${studentData.medium}/${subjectId}/${lessonId}`;

    database.ref(path).once('value', snapshot => {
        if (snapshot.exists()) {
            const lesson = snapshot.val();
            const isLocked = lesson.isPaid && !studentData.isPaid;

            contentEl.innerHTML = `
                <div class="fade-in">
                    <div class="flex items-center mb-4">
                        <button onclick="showPage('lessons', {subjectId: '${subjectId}', subjectName: 'Lessons'})" class="text-blue-500 hover:text-blue-700 p-2"><i class="fas fa-arrow-left text-xl"></i></button>
                        <h2 class="text-2xl font-bold ml-2 text-gray-800">${lesson.title}</h2>
                    </div>
                    <div class="flex space-x-2 mb-4">
                        <button id="read-btn" class="flex-1 gradient-primary text-white font-bold py-3 px-4 rounded-lg shadow-sm">Read Lesson</button>
                        <button id="qna-btn" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg">Q&A</button>
                    </div>
                    <div id="lesson-content-area" class="bg-white p-5 rounded-lg shadow-inner prose max-w-none"></div>
                </div>`;
            
            const readBtn = document.getElementById('read-btn');
            const qnaBtn = document.getElementById('qna-btn');
            const lessonContentArea = document.getElementById('lesson-content-area');

            const setActiveTab = (button) => {
                [readBtn, qnaBtn].forEach(btn => {
                    btn.classList.remove('gradient-primary', 'text-white');
                    btn.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
                });
                button.classList.add('gradient-primary', 'text-white');
                button.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
            };

            const showReadContent = () => {
                setActiveTab(readBtn);
                let contentHtml = isLocked
                    ? `<div class="prose max-w-none">${lesson.freeContent || 'This is a preview.'}</div>
                       <div class="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg text-center">
                           <p class="font-bold text-blue-800">This is a premium lesson!</p>
                           <p class="text-blue-700">Upgrade to view the full content.</p>
                       </div>`
                    : `<div class="prose max-w-none">${lesson.fullContent || 'No text content available.'}</div>`;
                lessonContentArea.innerHTML = contentHtml;
            };

            const showQnaContent = () => {
                setActiveTab(qnaBtn);
                let contentHtml = '';
                if (lesson.qna && lesson.qna.length > 0) {
                    contentHtml = lesson.qna.map(item => `
                        <div class="border rounded-lg mb-2">
                            <div class="p-3 font-semibold cursor-pointer flex justify-between items-center" onclick="toggleAnswer(this)">
                                <span>${item.question}</span>
                                <i class="fas fa-chevron-down transition-transform"></i>
                            </div>
                            <div class="qna-answer hidden p-3 border-t bg-gray-50 text-gray-700">${item.answer}</div>
                        </div>`).join('');
                } else {
                    contentHtml = '<p class="text-center text-gray-500">No Questions & Answers available for this lesson.</p>';
                }
                lessonContentArea.innerHTML = contentHtml;
            };

            readBtn.addEventListener('click', showReadContent);
            qnaBtn.addEventListener('click', showQnaContent);
            showReadContent();

        } else {
            contentEl.innerHTML = `<p class="text-center text-gray-500">Content not available.</p>`;
        }
    });
}

function toggleAnswer(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');
    answer.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
}

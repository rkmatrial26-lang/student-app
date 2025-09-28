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

// Listen for authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log("Logged in:", user.uid);
        database.ref('students/' + user.uid).once('value', snapshot => {
            studentData = snapshot.val();
            if (studentData) {
                renderApp();
            } else {
                // This case might happen if DB entry fails after registration.
                // For simplicity, we log them out to retry.
                console.error("User exists but no data found in DB. Logging out.");
                auth.signOut();
            }
        });
    } else {
        currentUser = null;
        studentData = {};
        console.log("Logged out");
        showAuthPage();
    }
});

// --- AUTHENTICATION & REGISTRATION ---

function showAuthPage() {
    document.getElementById('app-container').innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-teal-400 p-4">
            <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <div class="text-center mb-6">
                    <i class="fas fa-book-open text-blue-500 text-5xl mb-4"></i>
                    <h2 class="text-3xl font-bold text-gray-800">Welcome to LearnApp!</h2>
                </div>
                
                <!-- Login Form -->
                <form id="login-form">
                    <h3 class="text-xl font-semibold text-gray-700 mb-4 text-center">Login</h3>
                    <div class="space-y-4">
                        <input type="email" id="loginEmail" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-lg" required>
                        <input type="password" id="loginPassword" placeholder="Password" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    </div>
                    <button type="submit" class="w-full mt-6 gradient-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg">Login</button>
                    <p class="text-center mt-4 text-sm">
                        No account? <button type="button" class="font-semibold text-blue-600 hover:underline" onclick="toggleAuthView()">Register here</button>
                    </p>
                </form>

                <!-- Registration Form (Initially hidden) -->
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
                        </select>
                        <input type="email" id="regEmail" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-lg" required>
                        <input type="password" id="regPassword" placeholder="Password" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    </div>
                    <button type="submit" class="w-full mt-6 gradient-success text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg">Register</button>
                    <p class="text-center mt-4 text-sm">
                        Already have an account? <button type="button" class="font-semibold text-blue-600 hover:underline" onclick="toggleAuthView()">Login here</button>
                    </p>
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
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged will handle redirect
        } catch (error) {
            console.error("Login Error:", error);
            authError.textContent = "Invalid email or password.";
            authError.classList.remove('hidden');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Now, save the additional student data to the database
            const newStudentData = {
                uid: user.uid,
                email: user.email,
                fullName: document.getElementById('regFullName').value,
                class: document.getElementById('regClass').value,
                medium: document.getElementById('regMedium').value,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            await database.ref('students/' + user.uid).set(newStudentData);
            // onAuthStateChanged will handle redirect
        } catch (error) {
            console.error("Registration Error:", error);
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
        <header class="fixed top-0 left-0 right-0 z-10 bg-white p-4 shadow-md flex justify-between items-center max-w-md mx-auto w-full">
            <div class="flex items-center">
                <i class="fas fa-book-open text-blue-500 text-2xl mr-2"></i>
                <h1 class="text-xl font-bold">LearnApp</h1>
            </div>
            <div class="text-right">
                <p class="text-sm font-semibold">${studentData.fullName || 'Student'}</p>
                <p class="text-xs text-gray-500">Class: ${studentData.class || '-'}</p>
            </div>
        </header>
        <main id="main-content" class="flex-grow p-4 mt-[72px] mb-16 overflow-y-auto w-full"></main>
        <nav class="fixed bottom-0 left-0 right-0 z-10 bg-white shadow-lg p-3 flex justify-around items-center max-w-md mx-auto rounded-t-xl border-t">
            <button class="nav-item flex flex-col items-center" onclick="showPage('home')"><i class="fas fa-home text-xl"></i><span class="text-xs mt-1">Home</span></button>
            <button class="nav-item flex flex-col items-center" onclick="showPage('subjects')"><i class="fas fa-cube text-xl"></i><span class="text-xs mt-1">Subjects</span></button>
            <button class="nav-item flex flex-col items-center" onclick="showPage('lessons')"><i class="fas fa-chalkboard-teacher text-xl"></i><span class="text-xs mt-1">Lessons</span></button>
            <button class="nav-item flex flex-col items-center" onclick="showPage('profile')"><i class="fas fa-user-circle text-xl"></i><span class="text-xs mt-1">Profile</span></button>
        </nav>`;
    showPage('home');
}

async function showPage(page) {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = '<div class="text-center p-10"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>';

    document.querySelectorAll('.nav-item').forEach(item => {
        const isActive = item.getAttribute('onclick').includes(`'${page}'`);
        item.classList.toggle('text-blue-500', isActive);
        item.classList.toggle('text-gray-500', !isActive);
    });

    switch (page) {
        case 'home':
            content.innerHTML = `
                <div class="p-4 bg-gradient-to-r from-blue-100 to-teal-50 rounded-lg shadow-md mb-6">
                    <h2 class="text-2xl font-bold">Welcome, ${studentData.fullName}!</h2>
                    <p class="text-gray-600">Class ${studentData.class} (${studentData.medium} Medium)</p>
                </div>
                <div class="grid grid-cols-1 gap-4">
                    <div class="bg-white p-5 rounded-lg shadow-md border">
                        <h3 class="text-xl font-semibold mb-3 flex items-center"><i class="fas fa-link mr-2 text-blue-500"></i>Quick Links</h3>
                        <ul class="space-y-2">
                            <li><button onclick="showPage('subjects')" class="text-blue-500 hover:underline"><i class="fas fa-bookmark mr-2"></i>View My Subjects</button></li>
                            <li><button onclick="showPage('profile')" class="text-blue-500 hover:underline"><i class="fas fa-user mr-2"></i>My Profile</button></li>
                        </ul>
                    </div>
                    <div class="bg-white p-5 rounded-lg shadow-md border">
                        <h3 class="text-xl font-semibold mb-3 flex items-center"><i class="fas fa-chart-line mr-2 text-green-500"></i>My Progress</h3>
                        <p class="text-gray-600">Progress tracking coming soon!</p>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-4"><div class="bg-gradient-to-r from-green-500 to-teal-500 h-2.5 rounded-full" style="width: 45%"></div></div>
                        <p class="text-sm text-gray-500 mt-2">45% of lessons completed</p>
                    </div>
                </div>`;
            break;
        
        case 'subjects':
            content.innerHTML = `<h2 class="text-2xl font-bold mb-4">My Subjects</h2><div id="subjects-list" class="space-y-4"></div>`;
            fetchSubjects();
            break;
        
        case 'lessons':
            content.innerHTML = `
                <h2 class="text-2xl font-bold mb-4">Lessons</h2>
                <div class="mb-6 bg-white p-4 rounded-lg shadow-md">
                    <label for="subject-selector" class="block text-sm font-medium text-gray-700 mb-2">Select a Subject:</label>
                    <select id="subject-selector" class="w-full p-2 border border-gray-300 rounded-lg"></select>
                </div>
                <div id="lessons-list" class="space-y-4"></div>`;
            populateLessonSubjectSelector();
            break;
        
        case 'profile':
            content.innerHTML = `
                <h2 class="text-2xl font-bold mb-4">My Profile</h2>
                <div class="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div><strong class="text-gray-600">Name:</strong><p class="text-lg">${studentData.fullName}</p></div>
                    <div><strong class="text-gray-600">Email:</strong><p class="text-lg">${studentData.email}</p></div>
                    <div><strong class="text-gray-600">Class:</strong><p class="text-lg">${studentData.class}</p></div>
                    <div><strong class="text-gray-600">Medium:</strong><p class="text-lg">${studentData.medium}</p></div>
                    <button onclick="logout()" class="w-full mt-6 gradient-danger text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg">Logout</button>
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
            let html = Object.keys(subjects).map(id => {
                const subject = subjects[id];
                return `
                    <div class="bg-white p-4 rounded-lg shadow-md border flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="fas ${subject.icon || 'fa-book'} text-white text-xl p-3 rounded-full mr-4" style="background-color: ${subject.color || '#3B82F6'}"></i>
                            <div>
                                <h3 class="text-lg font-semibold">${subject.name}</h3>
                                <p class="text-sm text-gray-500">${subject.chapterCount || '0'} Chapters</p>
                            </div>
                        </div>
                        <button onclick="showPage('lessons')" class="text-blue-500 hover:text-blue-700"><i class="fas fa-arrow-right"></i></button>
                    </div>`;
            }).join('');
            listEl.innerHTML = html;
        } else {
            listEl.innerHTML = `<p class="text-center text-gray-500">No subjects found for your class.</p>`;
        }
    });
}

async function populateLessonSubjectSelector() {
    const selector = document.getElementById('subject-selector');
    const lessonsList = document.getElementById('lessons-list');
    const path = `subjects/${studentData.class}/${studentData.medium}`;
    
    try {
        const snapshot = await database.ref(path).once('value');
        if (snapshot.exists()) {
            const subjects = snapshot.val();
            selector.innerHTML = '<option value="">-- Select a subject --</option>';
            for (const id in subjects) {
                selector.innerHTML += `<option value="${id}">${subjects[id].name}</option>`;
            }
            selector.onchange = () => {
                const subjectId = selector.value;
                lessonsList.innerHTML = subjectId ? '' : '<p class="text-gray-500 text-center">Please select a subject to see lessons.</p>';
                if (subjectId) fetchLessons(subjectId);
            };
            lessonsList.innerHTML = '<p class="text-gray-500 text-center">Please select a subject to see lessons.</p>';
        } else {
            selector.innerHTML = '<option>No subjects found</option>';
        }
    } catch (error) {
        console.error("Error fetching subjects for dropdown:", error);
        selector.innerHTML = '<option>Error loading subjects</option>';
    }
}

function fetchLessons(subjectId) {
    const listEl = document.getElementById('lessons-list');
    listEl.innerHTML = '<div class="text-center p-10"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>';
    const path = `lessons/${studentData.class}/${studentData.medium}/${subjectId}`;
    
    database.ref(path).once('value', snapshot => {
        if (snapshot.exists()) {
            const lessons = snapshot.val();
            let html = Object.keys(lessons).map(id => `
                <div class="bg-white p-4 rounded-lg shadow-md border cursor-pointer hover:bg-gray-50" onclick="showLessonContent('${id}', this)">
                    <h3 class="text-lg font-semibold">${lessons[id].title}</h3>
                    <div id="content-${id}" class="mt-4 border-t pt-4 hidden"></div>
                </div>`
            ).join('');
            listEl.innerHTML = html;
        } else {
            listEl.innerHTML = `<p class="text-center text-gray-500">No lessons found for this subject.</p>`;
        }
    });
}

function showLessonContent(lessonId) {
    const contentEl = document.getElementById(`content-${lessonId}`);
    const isHidden = contentEl.classList.contains('hidden');

    // Close all other open lessons first
    document.querySelectorAll('[id^="content-"]').forEach(el => {
        if(el.id !== `content-${lessonId}`) {
            el.classList.add('hidden');
        }
    });

    if (!isHidden) {
        contentEl.classList.add('hidden');
        return;
    }

    contentEl.classList.remove('hidden');
    contentEl.innerHTML = '<p>Loading content...</p>';
    
    database.ref(`lessonContent/${lessonId}`).once('value', snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            let contentHtml = `<div class="prose max-w-none">${data.text || 'No text content available.'}</div>`;
            
            if (data.qna && data.qna.length > 0) {
                contentHtml += `<h4 class="text-md font-bold mt-6 mb-2">Questions & Answers</h4>`;
                contentHtml += '<div class="space-y-2">';
                data.qna.forEach((item) => {
                    contentHtml += `
                        <div class="border rounded-md">
                            <div class="p-3 font-semibold cursor-pointer flex justify-between items-center" onclick="toggleAnswer(this)">
                                <span>${item.question}</span>
                                <i class="fas fa-chevron-down transition-transform"></i>
                            </div>
                            <div class="qna-answer hidden p-3 border-t bg-gray-50 text-gray-600">
                                ${item.answer}
                            </div>
                        </div>`;
                });
                contentHtml += '</div>';
            }
            contentEl.innerHTML = contentHtml;
        } else {
            contentEl.innerHTML = `<p class="text-gray-500">Content not available for this lesson.</p>`;
        }
    });
}

function toggleAnswer(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');
    answer.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
}

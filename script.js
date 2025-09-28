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
                // Check if user is a paid subscriber
                studentData.isPaid = studentData.isPaidUser || false;
                renderApp();
            } else {
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
                <form id="login-form">
                    <h3 class="text-xl font-semibold text-gray-700 mb-4 text-center">Login</h3>
                    <div class="space-y-4">
                        <input type="email" id="loginEmail" placeholder="Email Address" class="w-full p-3 border border-gray-300 rounded-lg" required>
                        <input type="password" id="loginPassword" placeholder="Password" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    </div>
                    <button type="submit" class="w-full mt-6 gradient-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg">Login</button>
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
                
                <div class="text-center mt-6 border-t pt-4">
                    <a href="admin.html" class="text-sm text-gray-500 hover:text-blue-600 hover:underline">Admin Panel Access</a>
                </div>
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
                isPaidUser: false, // All new users are free by default
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
            <button class="nav-item flex flex-col items-center" onclick="showPage('subjects')"><i class="fas fa-home text-xl"></i><span class="text-xs mt-1">Home</span></button>
            <button class="nav-item flex flex-col items-center" onclick="showPage('profile')"><i class="fas fa-user-circle text-xl"></i><span class="text-xs mt-1">Profile</span></button>
        </nav>`;
    showPage('subjects'); // Start on the subjects page
}

async function showPage(page, data = null) {
    const content = document.getElementById('main-content');
    if (!content) return;
    content.innerHTML = '<div class="text-center p-10"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>';

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('text-blue-500');
        item.classList.add('text-gray-500');
    });

    const pageToButton = {
        'subjects': 'subjects',
        'lessons': 'subjects',
        'lesson': 'subjects',
        'profile': 'profile'
    };
    const buttonPage = pageToButton[page] || 'subjects';
    const activeNavItem = document.querySelector(`.nav-item[onclick*="'${buttonPage}'"]`);
    if(activeNavItem) {
        activeNavItem.classList.add('text-blue-500');
        activeNavItem.classList.remove('text-gray-500');
    }

    switch (page) {
        case 'subjects':
            content.innerHTML = `
                <div class="p-4 bg-gradient-to-r from-blue-100 to-teal-50 rounded-lg shadow-md mb-6">
                    <h2 class="text-2xl font-bold">Welcome, ${studentData.fullName}!</h2>
                    <p class="text-gray-600">Showing subjects for Class ${studentData.class} (${studentData.medium} Medium)</p>
                </div>
                <h2 class="text-2xl font-bold mb-4">My Subjects</h2>
                <div id="subjects-list" class="space-y-4"></div>`;
            fetchSubjects();
            break;
        
        case 'lessons':
            const { subjectId, subjectName } = data;
            content.innerHTML = `
                <div class="flex items-center mb-4">
                    <button onclick="showPage('subjects')" class="text-blue-500 hover:text-blue-700 p-2"><i class="fas fa-arrow-left text-xl"></i></button>
                    <h2 class="text-2xl font-bold ml-2">${subjectName}</h2>
                </div>
                <div id="lessons-list" class="space-y-4"></div>`;
            fetchLessons(subjectId);
            break;
        
        case 'lesson':
             const { lessonId, subjectId: sId } = data;
             fetchLessonDetail(lessonId, sId);
             break;

        case 'profile':
            content.innerHTML = `
                <h2 class="text-2xl font-bold mb-4">My Profile</h2>
                <div class="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div><strong class="text-gray-600">Name:</strong><p class="text-lg">${studentData.fullName}</p></div>
                    <div><strong class="text-gray-600">Email:</strong><p class="text-lg">${studentData.email}</p></div>
                    <div><strong class="text-gray-600">Class:</strong><p class="text-lg">${studentData.class}</p></div>
                    <div><strong class="text-gray-600">Status:</strong><p class="text-lg font-semibold ${studentData.isPaid ? 'text-green-500' : 'text-orange-500'}">${studentData.isPaid ? 'Paid User' : 'Free User'}</p></div>
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
            listEl.innerHTML = Object.keys(subjects).map(id => {
                const subject = subjects[id];
                return `
                    <div class="bg-white p-4 rounded-lg shadow-md border flex items-center justify-between cursor-pointer hover:bg-gray-50" 
                         onclick="showPage('lessons', { subjectId: '${id}', subjectName: '${subject.name}' })">
                        <div class="flex items-center">
                            <i class="fas ${subject.icon || 'fa-book'} text-white text-xl p-3 rounded-full mr-4" style="background-color: ${subject.color || '#3B82F6'}"></i>
                            <div>
                                <h3 class="text-lg font-semibold">${subject.name}</h3>
                                <p class="text-sm text-gray-500">${subject.chapterCount || '0'} Chapters</p>
                            </div>
                        </div>
                        <i class="fas fa-arrow-right text-blue-500"></i>
                    </div>`;
            }).join('');
        } else {
            listEl.innerHTML = `<p class="text-center text-gray-500">No subjects found for your class and medium.</p>`;
        }
    });
}


function fetchLessons(subjectId) {
    const listEl = document.getElementById('lessons-list');
    listEl.innerHTML = '<div class="text-center p-10"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i></div>';
    const path = `lessons/${studentData.class}/${studentData.medium}/${subjectId}`;
    
    database.ref(path).orderByChild('title').once('value', snapshot => {
        if (snapshot.exists()) {
            const lessons = snapshot.val();
            listEl.innerHTML = Object.keys(lessons).map((id, index) => {
                const lesson = lessons[id];
                return `
                <div class="bg-white p-4 rounded-lg shadow-md border cursor-pointer hover:bg-gray-50" 
                     onclick="showPage('lesson', { lessonId: '${id}', subjectId: '${subjectId}' })">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold">${index + 1}. ${lesson.title}</h3>
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

            // Main container for the lesson page
            contentEl.innerHTML = `
                <div class="flex items-center mb-4">
                    <button onclick="showPage('subjects')" class="text-blue-500 hover:text-blue-700 p-2"><i class="fas fa-home text-xl"></i></button>
                    <h2 class="text-2xl font-bold ml-2">${lesson.title}</h2>
                </div>
                <div class="flex space-x-2 mb-4">
                    <button id="read-btn" class="flex-1 gradient-primary text-white font-bold py-2 px-4 rounded-lg">Read Lesson</button>
                    <button id="qna-btn" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Questions & Answers</button>
                </div>
                <div id="lesson-content-area" class="bg-white p-4 rounded-lg shadow-inner"></div>
            `;
            
            const readBtn = document.getElementById('read-btn');
            const qnaBtn = document.getElementById('qna-btn');
            const lessonContentArea = document.getElementById('lesson-content-area');

            // Function to display lesson content
            const showReadContent = () => {
                readBtn.classList.add('gradient-primary', 'text-white');
                readBtn.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
                qnaBtn.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
                qnaBtn.classList.remove('gradient-primary', 'text-white');

                let contentHtml = '';
                if (isLocked) {
                    contentHtml = `
                        <div class="prose max-w-none">${lesson.freeContent || 'This is a preview.'}</div>
                        <div class="mt-4 p-4 bg-blue-100 border-l-4 border-blue-500 rounded-lg text-center">
                            <p class="font-bold text-blue-800">This is a premium lesson!</p>
                            <p class="text-blue-700">Upgrade to view the full content.</p>
                        </div>`;
                } else {
                    contentHtml = `<div class="prose max-w-none">${lesson.fullContent || 'No text content available.'}</div>`;
                }
                lessonContentArea.innerHTML = contentHtml;
            };

            // Function to display Q&A
            const showQnaContent = () => {
                qnaBtn.classList.add('gradient-primary', 'text-white');
                qnaBtn.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
                readBtn.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
                readBtn.classList.remove('gradient-primary', 'text-white');

                let contentHtml = '';
                if (lesson.qna && lesson.qna.length > 0) {
                    contentHtml += '<div class="space-y-2">';
                    lesson.qna.forEach((item) => {
                        contentHtml += `
                            <div class="border rounded-md">
                                <div class="p-3 font-semibold cursor-pointer flex justify-between items-center" onclick="toggleAnswer(this)">
                                    <span>${item.question}</span>
                                    <i class="fas fa-chevron-down transition-transform"></i>
                                </div>
                                <div class="qna-answer hidden p-3 border-t bg-gray-50 text-gray-600">${item.answer}</div>
                            </div>`;
                    });
                    contentHtml += '</div>';
                } else {
                    contentHtml = '<p class="text-center text-gray-500">No Questions & Answers available for this lesson.</p>';
                }
                lessonContentArea.innerHTML = contentHtml;
            };

            // Add event listeners and show the initial content
            readBtn.addEventListener('click', showReadContent);
            qnaBtn.addEventListener('click', showQnaContent);
            showReadContent(); // Show lesson content by default

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

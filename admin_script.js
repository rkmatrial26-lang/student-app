// --- Firebase Configuration ---
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

// --- Admin Authentication ---
async function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('admin-error');
    errorEl.textContent = 'Logging in...';

    try {
        await auth.signInWithEmailAndPassword(email, password);
        console.log("Admin login successful!");
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-content').classList.remove('hidden');
        errorEl.textContent = '';
        initializeApp(); 
    } catch (error) {
        console.error("Admin Login Error:", error.message);
        errorEl.textContent = "Login failed. Please check your email and password.";
    }
}

// --- App Initialization ---
function initializeApp() {
    populateClassDropdowns();
    setupEventListeners();
    document.getElementById('lesson-form').addEventListener('submit', saveLesson);
}

function populateClassDropdowns() {
    const classSelects = [
        document.getElementById('lesson-class'),
        document.getElementById('view-class')
    ];
    classSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Class</option>';
        for (let i = 1; i <= 10; i++) {
            select.innerHTML += `<option value="${i}th">${i}th</option>`;
        }
    });
}

function setupEventListeners() {
    // For the "Add/Edit" form
    document.getElementById('lesson-class').addEventListener('change', () => loadSubjects('lesson'));
    document.getElementById('lesson-medium').addEventListener('change', () => loadSubjects('lesson'));

    // For the "View/Manage" section
    document.getElementById('view-class').addEventListener('change', () => loadSubjects('view'));
    document.getElementById('view-medium').addEventListener('change', () => loadSubjects('view'));
    document.getElementById('view-subject').addEventListener('change', loadLessonsToView);
}


// --- Dynamic Subject Loading for Both Sections ---
function loadSubjects(type) { // type can be 'lesson' or 'view'
    const classVal = document.getElementById(`${type}-class`).value;
    const mediumVal = document.getElementById(`${type}-medium`).value;
    const subjectSelect = document.getElementById(`${type}-subject`);
    subjectSelect.innerHTML = '<option value="">Loading Subjects...</option>';

    if (!classVal || !mediumVal) {
        subjectSelect.innerHTML = '<option value="">Select Class and Medium</option>';
        return;
    }

    const path = `subjects/${classVal}/${mediumVal}`;
    database.ref(path).once('value', snapshot => {
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        if (snapshot.exists()) {
            const subjects = snapshot.val();
            for (const id in subjects) {
                subjectSelect.innerHTML += `<option value="${id}">${subjects[id].name}</option>`;
            }
        } else {
            subjectSelect.innerHTML = '<option value="">No subjects found</option>';
        }
    });
}

// --- Q&A Management ---
let qnaCount = 0;
function addQnaPair(question = '', answer = '') {
    qnaCount++;
    const container = document.getElementById('qna-container');
    const newPair = document.createElement('div');
    newPair.id = `qna-pair-${qnaCount}`;
    newPair.className = 'grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 border-t pt-2';
    newPair.innerHTML = `
        <input type="text" placeholder="Question ${qnaCount}" value="${question}" class="qna-question w-full p-2 border rounded-lg" required>
        <div class="flex">
            <input type="text" placeholder="Answer ${qnaCount}" value="${answer}" class="qna-answer w-full p-2 border rounded-lg" required>
            <button type="button" onclick="removeQnaPair(${qnaCount})" class="ml-2 text-red-500 hover:text-red-700 p-2"><i class="fas fa-trash"></i></button>
        </div>
    `;
    container.appendChild(newPair);
}

function removeQnaPair(id) {
    document.getElementById(`qna-pair-${id}`).remove();
}

function clearQnaContainer() {
    document.getElementById('qna-container').innerHTML = '<h3 class="text-lg font-semibold mt-4">Questions & Answers</h3>';
    qnaCount = 0;
}

// --- Save or Update Lesson Data ---
function saveLesson(e) {
    e.preventDefault();
    const successMessage = document.getElementById('success-message');
    successMessage.textContent = 'Saving...';

    const classVal = document.getElementById('lesson-class').value;
    const mediumVal = document.getElementById('lesson-medium').value;
    const subjectId = document.getElementById('lesson-subject').value;
    const lessonId = document.getElementById('lesson-id').value; // Check if we are editing

    const qnaData = [];
    document.querySelectorAll('#qna-container > div').forEach(pair => {
        const question = pair.querySelector('.qna-question').value;
        const answer = pair.querySelector('.qna-answer').value;
        if (question && answer) {
            qnaData.push({ question, answer });
        }
    });

    const lessonData = {
        title: document.getElementById('lesson-title').value,
        freeContent: document.getElementById('free-content').value,
        fullContent: document.getElementById('full-content').value,
        isPaid: document.getElementById('is-paid').checked,
        qna: qnaData
    };

    const path = `lessons/${classVal}/${mediumVal}/${subjectId}`;
    let lessonRef;

    if (lessonId) { // If lessonId exists, it's an update
        lessonRef = database.ref(`${path}/${lessonId}`);
    } else { // Otherwise, it's a new lesson
        lessonRef = database.ref(path).push();
    }
    
    lessonRef.set(lessonData)
        .then(() => {
            successMessage.textContent = 'Lesson saved successfully!';
            resetForm();
            loadLessonsToView(); // Refresh the list of lessons
            setTimeout(() => successMessage.textContent = '', 3000);
        })
        .catch(error => {
            console.error("Error saving lesson:", error);
            successMessage.textContent = 'Error saving lesson.';
        });
}

function resetForm() {
    document.getElementById('lesson-form').reset();
    document.getElementById('lesson-id').value = '';
    document.getElementById('form-title').textContent = 'Add a New Lesson';
    clearQnaContainer();
    window.scrollTo(0, 0); // Scroll to top
}

// --- Load, Edit, and Delete Lessons ---

function loadLessonsToView() {
    const classVal = document.getElementById('view-class').value;
    const mediumVal = document.getElementById('view-medium').value;
    const subjectId = document.getElementById('view-subject').value;
    const container = document.getElementById('lessons-list-container');
    container.innerHTML = '<p class="text-center">Loading lessons...</p>';

    if (!classVal || !mediumVal || !subjectId) {
        container.innerHTML = '<p class="text-center text-gray-500">Please select class, medium, and subject to see lessons.</p>';
        return;
    }

    const path = `lessons/${classVal}/${mediumVal}/${subjectId}`;
    database.ref(path).once('value', snapshot => {
        if (snapshot.exists()) {
            const lessons = snapshot.val();
            container.innerHTML = `<h3 class="text-xl font-bold mb-4">Found ${Object.keys(lessons).length} lessons</h3>`;
            container.innerHTML += Object.keys(lessons).map(id => {
                const lesson = lessons[id];
                return `
                    <div class="bg-gray-50 p-4 rounded-lg shadow-md border flex justify-between items-center mb-4">
                        <div>
                            <h4 class="text-lg font-semibold">${lesson.title}</h4>
                            <p class="text-sm text-gray-600">${lesson.isPaid ? 'Premium' : 'Free'}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="editLesson('${id}')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"><i class="fas fa-pencil-alt"></i></button>
                            <button onclick="deleteLesson('${id}')" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
            }).join('');
        } else {
            container.innerHTML = `<p class="text-center text-gray-500">No lessons found for this subject.</p>`;
        }
    });
}

function editLesson(lessonId) {
    const classVal = document.getElementById('view-class').value;
    const mediumVal = document.getElementById('view-medium').value;
    const subjectId = document.getElementById('view-subject').value;
    const path = `lessons/${classVal}/${mediumVal}/${subjectId}/${lessonId}`;

    database.ref(path).once('value', snapshot => {
        if (snapshot.exists()) {
            const lesson = snapshot.val();
            
            // Populate the form
            document.getElementById('lesson-id').value = lessonId;
            document.getElementById('lesson-class').value = classVal;
            document.getElementById('lesson-medium').value = mediumVal;
            
            // We need to load subjects for the form, then select the right one
            loadSubjects('lesson'); 
            setTimeout(() => { // Wait for subjects to load
                document.getElementById('lesson-subject').value = subjectId;
            }, 500);

            document.getElementById('lesson-title').value = lesson.title;
            document.getElementById('free-content').value = lesson.freeContent || '';
            document.getElementById('full-content').value = lesson.fullContent || '';
            document.getElementById('is-paid').checked = lesson.isPaid;

            // Populate Q&A
            clearQnaContainer();
            if (lesson.qna) {
                lesson.qna.forEach(pair => addQnaPair(pair.question, pair.answer));
            }

            // Change form title and scroll to top
            document.getElementById('form-title').textContent = `Editing: ${lesson.title}`;
            window.scrollTo(0, 0);
        }
    });
}

function deleteLesson(lessonId) {
    const classVal = document.getElementById('view-class').value;
    const mediumVal = document.getElementById('view-medium').value;
    const subjectId = document.getElementById('view-subject').value;

    const confirmed = confirm("Are you sure you want to delete this lesson? This action cannot be undone.");

    if (confirmed) {
        const path = `lessons/${classVal}/${mediumVal}/${subjectId}/${lessonId}`;
        database.ref(path).remove()
            .then(() => {
                alert("Lesson deleted successfully!");
                loadLessonsToView(); // Refresh the list
            })
            .catch(error => {
                alert("Error deleting lesson. Check the console for details.");
                console.error("Deletion error:", error);
            });
    }
}

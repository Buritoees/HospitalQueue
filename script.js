// ==========================================
// PRIORITY QUEUE DATA STRUCTURE
// ==========================================

/**
 * PriorityQueue - Core data structure for hospital patient triage system.
 * 
 * Patients are served based on medical priority (Emergency > Urgent > Normal).
 * Within the same priority level, patients follow FIFO (First In, First Out) order.
 * 
 * This Priority Queue implementation ensures:
 * 1. Emergency patients are always served first
 * 2. Urgent patients are served before Normal patients
 * 3. Patients with the same priority are served in arrival order (FIFO)
 * 
 * Operations:
 * - enqueue(patient): Add a patient to the queue according to priority
 * - dequeue(): Remove and return the highest-priority patient
 * - peek(): View the highest-priority patient without removing
 * - isEmpty(): Check if the queue is empty
 * - size(): Get the number of patients in the queue
 * - toArray(): Get a copy of all patients for display purposes
 */
class PriorityQueue {
    constructor() {
        // Internal storage for patients
        this.items = [];
    }
    
    /**
     * Add a patient to the queue.
     * Patients are inserted in priority order:
     * - Emergency (rank 1) comes first
     * - Urgent (rank 2) comes second
     * - Normal (rank 3) comes last
     * Within same priority, earlier arrivalOrder comes first (FIFO)
     */
    enqueue(patient) {
        // If queue is empty, just add the patient
        if (this.items.length === 0) {
            this.items.push(patient);
            return;
        }
        
        // Find the correct position to insert the patient
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            // Compare priority ranks first
            if (patient.priority.rank < this.items[i].priority.rank) {
                // Higher priority (lower rank number) - insert before this patient
                this.items.splice(i, 0, patient);
                added = true;
                break;
            } else if (patient.priority.rank === this.items[i].priority.rank) {
                // Same priority - maintain FIFO by checking arrival order
                if (patient.arrivalOrder < this.items[i].arrivalOrder) {
                    this.items.splice(i, 0, patient);
                    added = true;
                    break;
                }
            }
        }
        
        // If not inserted yet, add to the end (lowest priority or last in same priority)
        if (!added) {
            this.items.push(patient);
        }
    }
    
    /**
     * Remove and return the highest-priority patient.
     * The patient at index 0 is always the highest priority.
     * Returns null if queue is empty.
     */
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }
        // Remove and return the first patient (highest priority)
        return this.items.shift();
    }
    
    /**
     * View the highest-priority patient without removing them.
     * Returns null if queue is empty.
     */
    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[0];
    }
    
    /**
     * Check if the queue is empty.
     */
    isEmpty() {
        return this.items.length === 0;
    }
    
    /**
     * Get the number of patients in the queue.
     */
    size() {
        return this.items.length;
    }
    
    /**
     * Get a copy of all patients in the queue for display purposes.
     * Returns a new array, not a reference to the internal storage.
     */
    toArray() {
        return [...this.items];
    }
    
    /**
     * Clear all patients from the queue.
     */
    clear() {
        this.items = [];
    }
}

// ==========================================
// DATA STRUCTURES AND STATE
// ==========================================

const Priority = {
    EMERGENCY: { rank: 1, shortCode: 'E', label: 'Emergency', icon: '🚨', symbol: '⚠️' },
    URGENT: { rank: 2, shortCode: 'U', label: 'Urgent', icon: '⏰', symbol: '🔔' },
    NORMAL: { rank: 3, shortCode: 'N', label: 'Normal', icon: '📋', symbol: '✓' }
};

let nextPatientId = 101;
let nextArrivalOrder = 1;
let selectedPriority = null;

let nurses = [];
let patientQueue = []; // Temporary storage during setup phase
let priorityQueue = new PriorityQueue(); // The CORE Priority Queue for patient serving
let patientsServed = 0;
let totalPatients = 0;
let selectedLivePriority = null;
let nextNurseId = 1;
let queueTimerInterval = null;

// ==========================================
// SETUP SCREEN FUNCTIONS
// ==========================================

function adjustValue(inputId, delta) {
    const input = document.getElementById(inputId);
    let value = parseInt(input.value) || 0;
    value = Math.max(1, value + delta); // Removed max limit of 10
    input.value = value;
    
    if (inputId === 'numNurses') {
        generateNurseInputs();
    }
}

function generateNurseInputs() {
    const numNurses = parseInt(document.getElementById('numNurses').value) || 2;
    const container = document.getElementById('nurseInputs');
    container.innerHTML = '';
    
    for (let i = 0; i < numNurses; i++) {
        const div = document.createElement('div');
        div.className = 'nurse-input-group';
        div.innerHTML = `
            <label class="nurse-label" for="nurse${i}">Nurse ${i + 1}</label>
            <input type="text" id="nurse${i}" placeholder="Enter nurse name" 
                   value="Nurse ${i + 1}" autocomplete="off">
        `;
        container.appendChild(div);
    }
}

function startPatientSetup() {
    const numNurses = parseInt(document.getElementById('numNurses').value) || 2;
    nurses = [];
    nextNurseId = 1;
    
    // Check for duplicate nurse names
    const nurseNames = [];
    let hasDuplicates = false;
    
    for (let i = 0; i < numNurses; i++) {
        const nameInput = document.getElementById(`nurse${i}`);
        const name = nameInput.value.trim() || `Nurse ${i + 1}`;
        const nameLower = name.toLowerCase();
        
        // Check if this name already exists
        if (nurseNames.includes(nameLower)) {
            alert(`Duplicate nurse name detected: "${name}"\nEach nurse must have a unique name.`);
            nameInput.focus();
            nameInput.select();
            hasDuplicates = true;
            break;
        }
        
        nurseNames.push(nameLower);
        nurses.push({
            nurseId: nextNurseId++,
            name: name,
            isBusy: false,
            currentPatient: null
        });
    }
    
    // Don't proceed if duplicates found
    if (hasDuplicates) {
        nurses = [];
        return;
    }
    
    // Clear patient queue and reset patient list display
    patientQueue = [];
    updatePatientList();
    
    // Clear patient name input
    document.getElementById('patientName').value = '';
    
    switchScreen('patientScreen');
}

// ==========================================
// PATIENT SETUP FUNCTIONS
// ==========================================

function selectPriority(level) {
    // Remove previous selection
    document.querySelectorAll('.btn-priority').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add new selection
    const button = document.querySelector(`[data-level="${level}"]`);
    button.classList.add('selected');
    selectedPriority = level;
}

function addPatient() {
    const nameInput = document.getElementById('patientName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a patient name');
        return;
    }
    
    if (!selectedPriority) {
        alert('Please select a priority level');
        return;
    }
    
    // Check for duplicate patient names (case-insensitive)
    const nameLower = name.toLowerCase();
    const isDuplicate = patientQueue.some(patient => 
        patient.name.toLowerCase() === nameLower
    );
    
    if (isDuplicate) {
        alert(`Patient "${name}" is already registered.\nEach patient must have a unique name.`);
        nameInput.focus();
        nameInput.select();
        return;
    }
    
    const priority = Priority[selectedPriority];
    const serviceDuration = calculateServiceDuration(priority);
    
    const patient = {
        id: nextPatientId++,
        arrivalOrder: nextArrivalOrder++,
        name: name,
        level: selectedPriority,
        priority: priority,
        serviceDuration: serviceDuration,
        arrivalTime: 0
    };
    
    patientQueue.push(patient);
    
    // Reset form
    nameInput.value = '';
    document.querySelectorAll('.btn-priority').forEach(btn => {
        btn.classList.remove('selected');
    });
    selectedPriority = null;
    
    updatePatientList();
    nameInput.focus();
}

function calculateServiceDuration(priority) {
    const rand = Math.random();
    if (priority.rank === 1) { // Emergency
        return 1.0 + (rand * 1.0);
    } else if (priority.rank === 2) { // Urgent
        return 2.0 + (rand * 2.0);
    } else { // Normal
        return 2.0 + (rand * 3.0);
    }
}

function updatePatientList() {
    const listContainer = document.getElementById('patientList');
    const countElement = document.getElementById('patientCount');
    const startBtn = document.getElementById('startSimBtn');
    
    countElement.textContent = patientQueue.length;
    
    if (patientQueue.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No patients registered yet</p>';
        startBtn.disabled = true;
        return;
    }
    
    startBtn.disabled = false;
    
    // Sort by priority
    const sortedPatients = [...patientQueue].sort((a, b) => {
        if (a.priority.rank !== b.priority.rank) {
            return a.priority.rank - b.priority.rank;
        }
        return a.arrivalOrder - b.arrivalOrder;
    });
    
    listContainer.innerHTML = sortedPatients.map((patient, index) => `
        <div class="patient-item">
            <div class="patient-info">
                <div class="queue-position">${index + 1}</div>
                <div>
                    <div class="patient-name">${patient.name}</div>
                    <div class="patient-id">ID: ${patient.id} | Service: ${patient.serviceDuration.toFixed(1)}s</div>
                </div>
                <span class="patient-badge badge-${patient.level.toLowerCase()}">
                    <span class="priority-symbol-large">${patient.priority.symbol}</span>
                    ${patient.priority.label}
                </span>
            </div>
            <button class="btn-remove" onclick="removePatient(${patient.id})">Remove</button>
        </div>
    `).join('');
}

function removePatient(patientId) {
    patientQueue = patientQueue.filter(p => p.id !== patientId);
    updatePatientList();
}

// ==========================================
// SIMULATION FUNCTIONS
// ==========================================

function startSimulation() {
    if (patientQueue.length === 0) {
        alert('Please add at least one patient');
        return;
    }
    
    // Initialize simulation state
    patientsServed = 0;
    totalPatients = patientQueue.length;
    
    // Clear the Priority Queue and populate it with patients from setup
    priorityQueue.clear();
    
    const now = Date.now();
    patientQueue.forEach(patient => {
        // Add timestamp to track waiting time
        patient.queueEntryTime = now;
        // Enqueue patient into the Priority Queue
        // The PriorityQueue will automatically order by priority and arrival order
        priorityQueue.enqueue(patient);
    });
    
    // Reset nurses
    nurses.forEach(nurse => {
        nurse.isBusy = false;
        nurse.currentPatient = null;
    });
    
    switchScreen('simulationScreen');
    
    // Clear activity log
    const logContainer = document.getElementById('activityLog');
    logContainer.innerHTML = '<p class="log-entry">System initialized. Assigning patients to nurses...</p>';
    
    // Initial patient assignment
    addLog('🏥 System started', true);
    assignPatientsToAvailableNurses();
    
    updateSimulationDisplay();
    
    // Start the queue timer
    startQueueTimer();
}

/**
 * Assign patients to available nurses using the Priority Queue.
 * Each available nurse gets the next highest-priority patient via dequeue().
 */
function assignPatientsToAvailableNurses() {
    nurses.forEach(nurse => {
        if (!nurse.isBusy && !priorityQueue.isEmpty()) {
            // Dequeue the highest-priority patient from the Priority Queue
            const patient = priorityQueue.dequeue();
            assignPatientToNurse(nurse, patient);
        }
    });
    updateSimulationDisplay();
}

function assignPatientToNurse(nurse, patient) {
    nurse.isBusy = true;
    nurse.currentPatient = patient;
    
    addLog(`⏳ ${nurse.name} → ${patient.name} ${patient.priority.symbol}`);
    updateSimulationDisplay();
}

/**
 * Mark a patient as done and assign the next patient from the Priority Queue.
 */
function markPatientDone(nurseId) {
    const nurse = nurses.find(n => n.nurseId === nurseId);
    if (!nurse || !nurse.isBusy) return;
    
    const finishedPatient = nurse.currentPatient;
    nurse.isBusy = false;
    nurse.currentPatient = null;
    patientsServed++;
    
    addLog(`✅ ${finishedPatient.name} • ${nurse.name}`, true);
    
    // Check if there are more patients in the Priority Queue
    if (!priorityQueue.isEmpty()) {
        // Dequeue the next highest-priority patient
        const nextPatient = priorityQueue.dequeue();
        addLog(`🔄 ${nurse.name} ready`);
        assignPatientToNurse(nurse, nextPatient);
    } else {
        addLog(`💤 ${nurse.name} available`);
    }
    
    updateSimulationDisplay();
    
    // Check if all done
    checkIfComplete();
}

/**
 * Check if all patients have been processed.
 * Simulation is complete when:
 * 1. All nurses are available (not busy)
 * 2. The Priority Queue is empty
 */
function checkIfComplete() {
    const allDone = nurses.every(n => !n.isBusy) && priorityQueue.isEmpty();
    
    // Only show completion if we've actually served patients and everything is done
    if (allDone && patientsServed > 0 && totalPatients > 0) {
        setTimeout(() => {
            showCompletionSummary();
        }, 500);
    }
}

function showCompletionSummary() {
    // Show completion modal
    document.getElementById('finalTotal').textContent = totalPatients;
    document.getElementById('finalServed').textContent = patientsServed;
    
    const statusContainer = document.getElementById('finalNurseStatus');
    statusContainer.innerHTML = nurses.map(nurse => {
        return `
            <div class="final-nurse-item">
                <span><strong>${nurse.name}</strong></span>
                <span>AVAILABLE ✓</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('completionModal').classList.add('active');
    
    addLog('🎊 All patients processed', true);
    addLog(`📊 Total served: ${patientsServed}`, true);
}

function closeCompletionModal() {
    document.getElementById('completionModal').classList.remove('active');
}

// ==========================================
// LIVE ADD PATIENT FUNCTIONS
// ==========================================

function showAddPatientModal() {
    document.getElementById('livePatientName').value = '';
    document.querySelectorAll('#addPatientModal .btn-priority').forEach(btn => {
        btn.classList.remove('selected');
    });
    selectedLivePriority = null;
    document.getElementById('addPatientModal').classList.add('active');
    setTimeout(() => {
        document.getElementById('livePatientName').focus();
    }, 100);
}

function closeAddPatientModal() {
    document.getElementById('addPatientModal').classList.remove('active');
}

function selectLivePriority(level) {
    document.querySelectorAll('#addPatientModal .btn-priority').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const button = document.querySelector(`#addPatientModal [data-level="${level}"]`);
    button.classList.add('selected');
    selectedLivePriority = level;
}

/**
 * Add a new patient to the Priority Queue during live simulation.
 * The patient is automatically placed according to priority rules.
 */
function addLivePatient() {
    const nameInput = document.getElementById('livePatientName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a patient name');
        return;
    }
    
    if (!selectedLivePriority) {
        alert('Please select a priority level');
        return;
    }
    
    // Check for duplicate patient names (case-insensitive)
    // Check both in Priority Queue and currently being served
    const nameLower = name.toLowerCase();
    
    const isDuplicateInQueue = priorityQueue.toArray().some(patient => 
        patient.name.toLowerCase() === nameLower
    );
    
    const isDuplicateBeingServed = nurses.some(nurse => 
        nurse.isBusy && nurse.currentPatient.name.toLowerCase() === nameLower
    );
    
    if (isDuplicateInQueue || isDuplicateBeingServed) {
        alert(`Patient "${name}" is already in the system.\nEach patient must have a unique name.`);
        nameInput.focus();
        nameInput.select();
        return;
    }
    
    const priority = Priority[selectedLivePriority];
    const serviceDuration = calculateServiceDuration(priority);
    
    const patient = {
        id: nextPatientId++,
        arrivalOrder: nextArrivalOrder++,
        name: name,
        level: selectedLivePriority,
        priority: priority,
        serviceDuration: serviceDuration,
        arrivalTime: 0,
        queueEntryTime: Date.now()
    };
    
    // Enqueue the patient into the Priority Queue
    // The Priority Queue automatically maintains priority order
    priorityQueue.enqueue(patient);
    
    totalPatients++;
    
    addLog(`➕ ${patient.name} ${patient.priority.symbol}`, true);
    
    // Try to assign to available nurse immediately
    assignPatientsToAvailableNurses();
    
    updateSimulationDisplay();
    closeAddPatientModal();
}

// ==========================================
// LIVE ADD NURSE FUNCTIONS
// ==========================================

function showAddNurseModal() {
    document.getElementById('liveNurseName').value = '';
    document.getElementById('addNurseModal').classList.add('active');
    setTimeout(() => {
        document.getElementById('liveNurseName').focus();
    }, 100);
}

function closeAddNurseModal() {
    document.getElementById('addNurseModal').classList.remove('active');
}

function addLiveNurse() {
    const nameInput = document.getElementById('liveNurseName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a nurse name');
        return;
    }
    
    // Check for duplicate nurse names (case-insensitive)
    const nameLower = name.toLowerCase();
    const isDuplicate = nurses.some(nurse => 
        nurse.name.toLowerCase() === nameLower
    );
    
    if (isDuplicate) {
        alert(`Nurse "${name}" is already working in the system.\nEach nurse must have a unique name.`);
        nameInput.focus();
        nameInput.select();
        return;
    }
    
    const newNurse = {
        nurseId: nextNurseId++,
        name: name,
        isBusy: false,
        currentPatient: null
    };
    
    nurses.push(newNurse);
    
    addLog(`➕ ${newNurse.name} joined`, true);
    
    // Try to assign patient to the new nurse immediately
    assignPatientsToAvailableNurses();
    
    updateSimulationDisplay();
    closeAddNurseModal();
}

// ==========================================
// ACTIVITY LOG MODAL FUNCTIONS
// ==========================================

function showActivityLogModal() {
    document.getElementById('activityLogModal').classList.add('active');
    // Scroll to bottom of log when opening
    setTimeout(() => {
        const logContainer = document.getElementById('activityLog');
        logContainer.scrollTop = logContainer.scrollHeight;
    }, 100);
}

function closeActivityLogModal() {
    document.getElementById('activityLogModal').classList.remove('active');
}

function clearActivityLog() {
    const logContainer = document.getElementById('activityLog');
    logContainer.innerHTML = '<p class="log-entry">Activity log cleared.</p>';
}

// ==========================================
// QUEUE TIMER FUNCTIONS
// ==========================================

function startQueueTimer() {
    // Clear any existing timer
    if (queueTimerInterval) {
        clearInterval(queueTimerInterval);
    }
    
    // Update timer every second
    queueTimerInterval = setInterval(() => {
        updateQueueTimers();
    }, 1000);
}

function stopQueueTimer() {
    if (queueTimerInterval) {
        clearInterval(queueTimerInterval);
        queueTimerInterval = null;
    }
}

/**
 * Update the queue timers for patients waiting in the Priority Queue.
 */
function updateQueueTimers() {
    const now = Date.now();
    
    // Get all patients from the Priority Queue for display
    const queuedPatients = priorityQueue.toArray();
    
    queuedPatients.forEach((patient, index) => {
        if (patient.queueEntryTime) {
            const waitingTimeMs = now - patient.queueEntryTime;
            const waitingTimeSec = Math.floor(waitingTimeMs / 1000);
            
            // Update the timer display
            const timerElement = document.getElementById(`queue-timer-${patient.id}`);
            if (timerElement) {
                timerElement.textContent = formatWaitTime(waitingTimeSec);
                
                // Add warning class if waiting too long (> 5 minutes for normal, > 2 min for urgent, > 1 min for emergency)
                const warningThreshold = patient.priority.rank === 1 ? 60 : (patient.priority.rank === 2 ? 120 : 300);
                if (waitingTimeSec > warningThreshold) {
                    timerElement.classList.add('timer-warning');
                } else {
                    timerElement.classList.remove('timer-warning');
                }
            }
        }
    });
}

function formatWaitTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

// ==========================================
// DISPLAY UPDATE FUNCTIONS
// ==========================================

/**
 * Update the simulation display with current Priority Queue state.
 */
function updateSimulationDisplay() {
    // Update stats
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('patientsServed').textContent = patientsServed;
    document.getElementById('inQueue').textContent = priorityQueue.size();
    document.getElementById('nurseCount').textContent = nurses.length;
    
    const beingServed = nurses.filter(n => n.isBusy).length;
    document.getElementById('beingServed').textContent = beingServed;
    
    // Update nurse cards
    const nurseContainer = document.getElementById('nurseCards');
    nurseContainer.innerHTML = nurses.map((nurse) => {
        const statusClass = nurse.isBusy ? 'busy' : 'available';
        const statusText = nurse.isBusy ? 'SERVING PATIENT' : 'AVAILABLE';
        const statusBadgeClass = nurse.isBusy ? 'status-busy' : 'status-available';
        
        let patientInfo = '';
        let actionButton = '';
        
        if (nurse.isBusy) {
            patientInfo = `
                <div class="nurse-patient-info">
                    <div class="patient-detail">
                        <span><strong>Patient:</strong> ${nurse.currentPatient.name}</span>
                        <span class="patient-badge badge-${nurse.currentPatient.level.toLowerCase()}">
                            <span class="priority-symbol-large">${nurse.currentPatient.priority.symbol}</span>
                            ${nurse.currentPatient.priority.label}
                        </span>
                    </div>
                    <div class="patient-detail">
                        <span>ID: ${nurse.currentPatient.id}</span>
                        <span>Est. Time: ${nurse.currentPatient.serviceDuration.toFixed(1)}s</span>
                    </div>
                    <div class="service-status">
                        <span class="status-icon loading">⏳</span>
                        <span>In Progress...</span>
                    </div>
                </div>
            `;
            actionButton = `
                <button class="btn-done" onclick="markPatientDone(${nurse.nurseId})">
                    <span class="done-icon">✅</span> Mark as Done
                </button>
            `;
        } else {
            patientInfo = `
                <div class="nurse-available-state">
                    <p>👍 Ready to serve next patient</p>
                </div>
            `;
        }
        
        return `
            <div class="nurse-card ${statusClass}">
                <div class="nurse-header">
                    <span class="nurse-name">👨‍⚕️ ${nurse.name}</span>
                    <span class="nurse-status ${statusBadgeClass}">${statusText}</span>
                </div>
                ${patientInfo}
                ${actionButton}
            </div>
        `;
    }).join('');
    
    // Update waiting queue display - get patients from Priority Queue
    const queueContainer = document.getElementById('waitingQueue');
    const queuedPatients = priorityQueue.toArray();
    
    if (queuedPatients.length === 0) {
        queueContainer.innerHTML = '<p class="empty-state">✅ No patients in queue</p>';
    } else {
        const now = Date.now();
        queueContainer.innerHTML = queuedPatients.map((patient, index) => {
            const entryTime = patient.queueEntryTime ? formatTime(patient.queueEntryTime) : 'N/A';
            const waitingTimeSec = patient.queueEntryTime ? Math.floor((now - patient.queueEntryTime) / 1000) : 0;
            const waitTimeStr = formatWaitTime(waitingTimeSec);
            
            // Determine warning threshold
            const warningThreshold = patient.priority.rank === 1 ? 60 : (patient.priority.rank === 2 ? 120 : 300);
            const timerClass = waitingTimeSec > warningThreshold ? 'timer-warning' : '';
            
            // Add priority class for background color
            const priorityClass = `queue-priority-${patient.level.toLowerCase()}`;
            
            return `
                <div class="queue-item ${priorityClass}">
                    <div class="queue-position">${index + 1}</div>
                    <div class="queue-patient-info">
                        <div class="queue-patient-name">${patient.name}</div>
                        <div class="queue-patient-meta">
                            ID: ${patient.id} | 
                            <span class="queue-priority-symbol">${patient.priority.symbol}</span>
                            ${patient.priority.label} | 
                            Est. ${patient.serviceDuration.toFixed(1)}s
                        </div>
                        <div class="queue-timer-info">
                            <span class="queue-entry-time">⏰ Added: ${entryTime}</span>
                            <span class="queue-wait-timer ${timerClass}" id="queue-timer-${patient.id}">⏱️ ${waitTimeStr}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function addLog(message, important = false) {
    const logContainer = document.getElementById('activityLog');
    const entry = document.createElement('p');
    entry.className = 'log-entry' + (important ? ' important' : '');
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function completeSimulation() {
    // Show completion modal
    document.getElementById('finalTotal').textContent = totalPatients;
    document.getElementById('finalServed').textContent = patientsServed;
    
    const statusContainer = document.getElementById('finalNurseStatus');
    statusContainer.innerHTML = nurses.map(nurse => {
        return `
            <div class="final-nurse-item">
                <span><strong>${nurse.name}</strong></span>
                <span>AVAILABLE ✓</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('completionModal').classList.add('active');
    
    addLog('--- ALL PATIENTS PROCESSED ---', true);
    addLog(`🎉 Total Patients Served: ${patientsServed}`, true);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

/**
 * Handle back button from Setup Screen
 * Since Setup is the first screen, we don't go anywhere
 * This function exists for consistency but could reset the form
 */
function handleBackFromSetup() {
    // Reset to initial setup values
    document.getElementById('numNurses').value = 2;
    generateNurseInputs();
}

/**
 * Handle back button from Patient Screen
 * Returns to Setup Screen and preserves nurse configuration
 */
function handleBackFromPatient() {
    // Confirm if there are registered patients
    if (patientQueue.length > 0) {
        const confirmBack = confirm(
            `You have ${patientQueue.length} registered patient(s).\n\n` +
            'Going back will clear all registered patients.\n\n' +
            'Do you want to continue?'
        );
        
        if (!confirmBack) {
            return;
        }
    }
    
    // Clear patient data
    patientQueue = [];
    nextPatientId = 101;
    nextArrivalOrder = 1;
    selectedPriority = null;
    
    // Clear patient form
    document.getElementById('patientName').value = '';
    document.querySelectorAll('.btn-priority').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Update patient list display
    updatePatientList();
    
    // Go back to setup screen
    switchScreen('setupScreen');
}

/**
 * Reset the entire system to initial state.
 * Clears the Priority Queue and all other state.
 */
function resetSystem() {
    // Stop the queue timer
    stopQueueTimer();
    
    // Reset all state
    nextPatientId = 101;
    nextArrivalOrder = 1;
    selectedPriority = null;
    selectedLivePriority = null;
    nurses = [];
    patientQueue = [];
    priorityQueue.clear(); // Clear the Priority Queue
    patientsServed = 0;
    totalPatients = 0;
    nextNurseId = 1;
    
    // Hide modals
    document.getElementById('completionModal').classList.remove('active');
    document.getElementById('addPatientModal').classList.remove('active');
    document.getElementById('addNurseModal').classList.remove('active');
    document.getElementById('activityLogModal').classList.remove('active');
    
    // Reset setup screen inputs
    document.getElementById('numNurses').value = 2;
    
    // Clear patient screen inputs and list
    document.getElementById('patientName').value = '';
    
    // Clear any selected priority
    document.querySelectorAll('.btn-priority').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Clear patient list display
    const patientListContainer = document.getElementById('patientList');
    if (patientListContainer) {
        patientListContainer.innerHTML = '<p class="empty-state">No patients registered yet</p>';
    }
    
    // Reset patient count
    const patientCountElement = document.getElementById('patientCount');
    if (patientCountElement) {
        patientCountElement.textContent = '0';
    }
    
    // Disable start simulation button
    const startBtn = document.getElementById('startSimBtn');
    if (startBtn) {
        startBtn.disabled = true;
    }
    
    // Clear simulation screen elements
    const nurseCards = document.getElementById('nurseCards');
    if (nurseCards) {
        nurseCards.innerHTML = '';
    }
    
    const waitingQueueContainer = document.getElementById('waitingQueue');
    if (waitingQueueContainer) {
        waitingQueueContainer.innerHTML = '<p class="empty-state">No patients in queue</p>';
    }
    
    const activityLog = document.getElementById('activityLog');
    if (activityLog) {
        activityLog.innerHTML = '<p class="log-entry">System initialized. Assign patients to available nurses...</p>';
    }
    
    // Reset all statistics
    if (document.getElementById('totalPatients')) {
        document.getElementById('totalPatients').textContent = '0';
    }
    if (document.getElementById('patientsServed')) {
        document.getElementById('patientsServed').textContent = '0';
    }
    if (document.getElementById('inQueue')) {
        document.getElementById('inQueue').textContent = '0';
    }
    if (document.getElementById('beingServed')) {
        document.getElementById('beingServed').textContent = '0';
    }
    if (document.getElementById('nurseCount')) {
        document.getElementById('nurseCount').textContent = '0';
    }
    
    // Go back to setup and regenerate nurse inputs
    generateNurseInputs();
    switchScreen('setupScreen');
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    generateNurseInputs();
    
    // Add Enter key listener for patient name input
    document.getElementById('patientName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addPatient();
        }
    });
    
    // Add number input listener
    document.getElementById('numNurses').addEventListener('input', () => {
        generateNurseInputs();
    });
    
    // Add Enter key listeners for live modals
    document.getElementById('livePatientName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addLivePatient();
        }
    });
    
    document.getElementById('liveNurseName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addLiveNurse();
        }
    });
});



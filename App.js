import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, SafeAreaView, Platform,
  Modal, TextInput, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

function parseDueDate(str) {
  if (!str || !str.includes('-')) return new Date();
  const [yyyy, mm, dd] = str.split('-');
  return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
}

function formatDueDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function DatePickerField({ value, onChange, containerStyle }) {
  const [show, setShow] = useState(false);
  const date = parseDueDate(value);

  const handleChange = (_event, selectedDate) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) onChange(formatDueDate(selectedDate));
  };

  return (
    <>
      <TouchableOpacity
        style={[ms.input, ms.datePickerBtn, containerStyle]}
        onPress={() => setShow(true)}
        activeOpacity={0.8}
      >
        <Text style={value ? ms.datePickerText : ms.datePickerPlaceholder}>
          {value || '날짜 선택'}
        </Text>
        <Text style={ms.datePickerIcon}>📅</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          locale="ko-KR"
        />
      )}
    </>
  );
}


const PROGRESS_COLORS = ['#6366F1', '#A78BFA', '#EC4899', '#F59E0B', '#22C55E', '#3B82F6'];
const CATEGORIES = ['업무', '개인', '학습', '기타', 'test'];

function EditTaskModal({ visible, task, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('진행중');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDueDate(task.dueDate);
      setStatus(task.status);
      setCategory(task.category || '');
    }
  }, [task]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ms.overlay}>
        <View style={ms.box}>
          <Text style={ms.title}>Task 수정</Text>
          <Text style={ms.label}>제목</Text>
          <TextInput
            style={ms.input}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#6B7280"
          />
          <Text style={ms.label}>마감일</Text>
          <DatePickerField value={dueDate} onChange={setDueDate} />
          <Text style={ms.label}>상태</Text>
          <View style={ms.statusRow}>
            {['진행중', '대기', '완료'].map(s => (
              <TouchableOpacity
                key={s}
                style={[ms.statusBtn, status === s && ms.statusBtnActive]}
                onPress={() => setStatus(s)}
                activeOpacity={0.8}
              >
                <Text style={[ms.statusBtnText, status === s && ms.statusBtnTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={ms.label}>카테고리</Text>
          <View style={ms.categoryRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[ms.categoryBtn, category === c && ms.categoryBtnActive]}
                onPress={() => setCategory(c)}
                activeOpacity={0.8}
              >
                <Text style={[ms.categoryBtnText, category === c && ms.categoryBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={ms.actions}>
            <TouchableOpacity style={ms.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={ms.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={ms.saveBtn}
              onPress={() => onSave(task.id, { title, dueDate, status, category })}
              activeOpacity={0.8}
            >
              <Text style={ms.saveText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AddTaskModal({ visible, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('진행중');
  const [category, setCategory] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), dueDate, status, category });
    setTitle('');
    setDueDate('');
    setStatus('진행중');
    setCategory('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ms.overlay}>
        <View style={ms.box}>
          <Text style={ms.title}>Task 등록</Text>
          <Text style={ms.label}>제목</Text>
          <TextInput
            style={ms.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Task 이름을 입력하세요"
            placeholderTextColor="#6B7280"
          />
          <Text style={ms.label}>마감일</Text>
          <DatePickerField value={dueDate} onChange={setDueDate} />
          <Text style={ms.label}>상태</Text>
          <View style={ms.statusRow}>
            {['진행중', '대기', '완료'].map(s => (
              <TouchableOpacity
                key={s}
                style={[ms.statusBtn, status === s && ms.statusBtnActive]}
                onPress={() => setStatus(s)}
                activeOpacity={0.8}
              >
                <Text style={[ms.statusBtnText, status === s && ms.statusBtnTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={ms.label}>카테고리</Text>
          <View style={ms.categoryRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[ms.categoryBtn, category === c && ms.categoryBtnActive]}
                onPress={() => setCategory(c)}
                activeOpacity={0.8}
              >
                <Text style={[ms.categoryBtnText, category === c && ms.categoryBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={ms.actions}>
            <TouchableOpacity style={ms.saveBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Text style={ms.saveText}>등록</Text>
            </TouchableOpacity>
			<TouchableOpacity style={ms.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={ms.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function InProgressScreen({ onBack, tasks, onUpdateTask }) {
  const [editTask, setEditTask] = useState(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>진행중인 Task</Text>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>진행중 Task</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{tasks.length}</Text>
            </View>
          </View>
          {tasks.length === 0 && (
            <Text style={styles.emptyText}>진행중인 Task가 없습니다.</Text>
          )}
          {tasks.map((task, idx) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskRow, idx < tasks.length - 1 && styles.rowDivider]}
              onPress={() => setEditTask(task)}
              activeOpacity={0.7}
            >
              <View style={styles.taskLeft}>
                <View style={[styles.statusDot, styles.dotGreen]} />
                <View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}> {task.dueDate} 마감</Text>
                </View>
              </View>
              <View style={[styles.pill, styles.pillGreen]}>
                <Text style={[styles.pillText, styles.pillTextGreen]}>{task.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <EditTaskModal
        visible={!!editTask}
        task={editTask}
        onClose={() => setEditTask(null)}
        onSave={(id, updates) => {
          onUpdateTask(id, updates);
          setEditTask(null);
        }}
      />
    </SafeAreaView>
  );
}

function TaskDetailScreen({ task, isPast, onBack, onSave, onDelete }) {
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [status, setStatus] = useState(task.status || '진행중');
  const [category, setCategory] = useState(task.category || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [progress, setProgress] = useState(task.progress ?? 0);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageAction, setMessageAction] = useState(null);

  const dotStyle =
    task.status === '진행중' ? styles.dotGreen
    : task.status === '완료' ? styles.dotBlue
    : styles.dotAmber;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Task 수정</Text>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 제목 */}
        <View style={[styles.card, styles.detailTitleCard]}>
          <View style={[styles.statusDot, dotStyle, styles.detailTitleDot]} />
          <Text style={styles.detailTitleText}>{task.title}</Text>
        </View>

        {/* 필드 */}
        <View style={styles.card}>
		{/* 카테고리 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>카테고리</Text>
            {isPast ? (
              <Text style={styles.detailFieldValue}>{category || '-'}</Text>
            ) : (
              <View style={ms.categoryRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[ms.categoryBtn, category === c && ms.categoryBtnActive]}
                    onPress={() => setCategory(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[ms.categoryBtnText, category === c && ms.categoryBtnTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
		
          {/* 등록일 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>등록일</Text>
            <Text style={styles.detailFieldValueMuted}>{task.registeredAt || '-'}</Text>
          </View>

          

          {/* 마감일 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>마감일</Text>
            {isPast ? (
              <Text style={styles.detailFieldValue}>{dueDate || '-'}</Text>
            ) : (
              <DatePickerField value={dueDate} onChange={setDueDate} containerStyle={styles.detailInput} />
            )}
          </View>

          {/* 상태 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>상태</Text>
            {isPast ? (
              <View style={[styles.pill, styles.pillBlue]}>
                <Text style={[styles.pillText, styles.pillTextBlue]}>{status}</Text>
              </View>
            ) : (
              <View style={ms.statusRow}>
                {['진행중', '대기', '완료'].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[ms.statusBtn, status === s && ms.statusBtnActive]}
                    onPress={() => setStatus(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[ms.statusBtnText, status === s && ms.statusBtnTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 진척률 */}
          <View style={[styles.detailFieldBlock, styles.rowDivider]}>
            <Text style={styles.detailFieldLabel}>진척률</Text>
            {isPast ? (
              <Text style={styles.detailFieldValue}>{progress}%</Text>
            ) : (
              <View style={styles.progressInputRow}>
                <TouchableOpacity
                  style={styles.progressAdjBtn}
                  onPress={() => setProgress(p => Math.max(0, p - 5))}
                  activeOpacity={0.75}
                >
                  <Text style={styles.progressAdjBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.progressInputValue}>{progress}%</Text>
                <TouchableOpacity
                  style={styles.progressAdjBtn}
                  onPress={() => setProgress(p => Math.min(100, p + 5))}
                  activeOpacity={0.75}
                >
                  <Text style={styles.progressAdjBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 특이사항 */}
          <View style={styles.detailFieldBlock}>
            <Text style={styles.detailFieldLabel}>특이사항</Text>
            {isPast ? (
              <Text style={styles.detailFieldValue}>{notes || '-'}</Text>
            ) : (
              <TextInput
                style={[ms.input, styles.detailInput, styles.detailNotesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="특이사항을 입력하세요"
                placeholderTextColor="#4B5563"
                multiline
              />
            )}
          </View>
        </View>

        {!isPast && (
          <View style={styles.detailBtnRow}>
            <TouchableOpacity
              style={[styles.detailBtn, styles.detailDeleteBtn]}
              onPress={() => setDeleteConfirmVisible(true)}
              activeOpacity={0.82}
            >
              <Text style={styles.detailBtnText}>삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.detailBtn, styles.detailSaveBtn]}
              onPress={() => onSave(task.id, { dueDate, status, category, notes, progress })}
              activeOpacity={0.82}
            >
              <Text style={styles.detailBtnText}>저장</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={ms.box}>
            <Text style={ms.title}>Task 삭제</Text>
            <Text style={[ms.label, { fontSize: 14, color: '#E5E7EB', marginBottom: 24 }]}>
              {`'${task.title}' task를 삭제하시겠습니까?`}
            </Text>
            <View style={ms.actions}>
              <TouchableOpacity
                style={ms.cancelBtn}
                onPress={() => setDeleteConfirmVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={ms.cancelText}>아니오</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ms.saveBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  setDeleteConfirmVisible(false);
                  setMessageText('삭제가 완료되었습니다.');
                  setMessageAction(() => () => onDelete(task.id));
                  setMessageVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={ms.saveText}>예</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={messageVisible} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={ms.box}>
            <Text style={[ms.label, { fontSize: 15, color: '#E5E7EB', marginBottom: 24, textAlign: 'center' }]}>
              {messageText}
            </Text>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                style={[ms.saveBtn, { paddingHorizontal: 40 }]}
                onPress={() => {
                  setMessageVisible(false);
                  if (messageAction) messageAction();
                }}
                activeOpacity={0.8}
              >
                <Text style={ms.saveText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const DEFAULT_TASKS = [
  { id: 1, title: '앱 UI 디자인', status: '진행중', dueDate: '2026-05-03', registeredAt: '2026-04-28', notes: '', progress: 75, category: '업무' },
  { id: 2, title: '마케팅 기획서 작성', status: '진행중', dueDate: '2026-05-05', registeredAt: '2026-04-29', notes: '', progress: 40, category: '업무' },
  { id: 3, title: '서버 API 연동', status: '대기', dueDate: '2026-05-10', registeredAt: '2026-04-30', notes: '', progress: 10, category: '업무' },
];

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [taskFilter, setTaskFilter] = useState('현재');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('tasks'),
      AsyncStorage.getItem('nextId'),
    ]).then(([savedTasks, savedNextId]) => {
      setTasks(savedTasks ? JSON.parse(savedTasks) : DEFAULT_TASKS);
      setNextId(savedNextId ? JSON.parse(savedNextId) : 7);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem('nextId', JSON.stringify(nextId));
  }, [nextId, loaded]);

  const handleUpdateTask = (id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setScreen('home');
  };

  const handleAddTask = (taskData) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setTasks(prev => [...prev, { id: nextId, registeredAt: `${yyyy}-${mm}-${dd}`, notes: '', ...taskData }]);
    setNextId(n => n + 1);
    setAddModalVisible(false);
  };

  const today = new Date();
  const headerDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const PAST_TASKS = tasks
    .filter(t => t.status === '완료')
    .map(t => ({ id: t.id, title: t.title, doneAt: t.dueDate, category: t.category || '-' }));

  const inProgressTasks = tasks
    .filter(t => t.status === '진행중')
    .sort((a, b) => parseDueDate(a.dueDate) - parseDueDate(b.dueDate));
  const totalCompleted = PAST_TASKS.length;
  const totalAll = tasks.length;
  const avgAchievement = totalAll > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.progress ?? 0), 0) / totalAll) : 0;

  const allTasksDisplay = tasks;
  const pastTasksList = PAST_TASKS;

  const STATUS_ORDER = { '진행중': 0, '대기': 1, '완료': 2 };
  const sortByStatusThenDue = (a, b) => {
    const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (so !== 0) return so;
    return parseDueDate(a.dueDate) - parseDueDate(b.dueDate);
  };

  const displayedTasks = taskFilter === '전체'
    ? [...tasks].sort(sortByStatusThenDue)
    : [...tasks].filter(t => t.status !== '완료').sort(sortByStatusThenDue);

  const handleTaskPress = (task) => {
    setSelectedTaskId(task.id);
    setScreen('taskdetail');
  };

  if (screen === 'inprogress') {
    return (
      <InProgressScreen
        onBack={() => setScreen('home')}
        tasks={inProgressTasks}
        onUpdateTask={handleUpdateTask}
      />
    );
  }

  if (screen === 'taskdetail') {
    const selectedTask = allTasksDisplay.find(t => t.id === selectedTaskId);
    const isPast = false;
    return (
      <TaskDetailScreen
        key={selectedTaskId}
        task={selectedTask}
        isPast={isPast}
        onBack={() => setScreen('home')}
        onSave={(id, updates) => {
          handleUpdateTask(id, updates);
          setScreen('home');
        }}
        onDelete={handleDeleteTask}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerGreeting}>👋 안녕하세요 👋</Text>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>태린이의 Task 관리</Text>
            <TouchableOpacity
              style={styles.addTaskBtn}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addTaskBtnText}>New Task</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerDate}>{headerDate}</Text>
        </View>

        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard2}
            activeOpacity={0.75}
            onPress={() => setScreen('inprogress')}
          >
            <Text style={styles.statValue}>{inProgressTasks.length}</Text>
            <Text style={styles.statLabel2}>진행중</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={[styles.statValue, styles.statValueLight]}>{avgAchievement}%</Text>
            <Text style={[styles.statLabel, styles.statLabelLight]}>평균 달성률</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>완료됨</Text>
          </View>
        </View>

        {/* ── Card 1 : Task 목록 ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Task 목록</Text>
            <View style={styles.filterRow}>
              {['현재', '전체'].map(f => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterBtn,
                    taskFilter === f && styles.filterBtnActive,
                    Platform.OS === 'web' && { cursor: 'pointer' },
                  ]}
                  onPress={() => setTaskFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterBtnText, taskFilter === f && styles.filterBtnTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{displayedTasks.length}</Text>
            </View>
          </View>

          {displayedTasks.map((task, idx) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskRow, idx < displayedTasks.length - 1 && styles.rowDivider]}
              onPress={() => handleTaskPress(task)}
              activeOpacity={0.7}
            >
              <View style={styles.taskLeft}>
                <View
                  style={[
                    styles.statusDot,
                    task.status === '진행중' ? styles.dotGreen
                    : task.status === '완료' ? styles.dotBlue
                    : styles.dotAmber,
                  ]}
                />
                <View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>{task.category ? `${task.category} · ` : ''}{task.dueDate ? `${task.dueDate}` : '' } 마감 예정</Text>
                </View>
              </View>
              <View
                style={[
                  styles.pill,
                  task.status === '진행중' ? styles.pillGreen
                  : task.status === '완료' ? styles.pillBlue
                  : styles.pillAmber,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    task.status === '진행중' ? styles.pillTextGreen
                    : task.status === '완료' ? styles.pillTextBlue
                    : styles.pillTextAmber,
                  ]}
                >
                  {task.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Card 2 : Task별 진척률 ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Task별 진척률</Text>
          </View>

          {tasks.map((task, idx) => (
            <View
              key={task.id}
              style={idx < tasks.length - 1 ? styles.progressItemGap : null}
            >
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>{task.title}</Text>
                <Text style={styles.progressPercent}>{task.progress ?? 0}%</Text>
              </View>
              <View style={styles.trackBg}>
                <View
                  style={[
                    styles.trackFill,
                    { width: `${task.progress ?? 0}%`, backgroundColor: PROGRESS_COLORS[idx % PROGRESS_COLORS.length] },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── Card 3 : 지난 Task 목록 ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>완료 Task 목록</Text>
          </View>

          {pastTasksList.map((task, idx) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.pastRow, idx < pastTasksList.length - 1 && styles.rowDivider]}
              onPress={() => handleTaskPress(task)}
              activeOpacity={0.7}
            >
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <View style={styles.pastInfo}>
                <Text style={styles.pastTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>{task.doneAt} 완료</Text>
              </View>
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{task.category}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Detail Button ── 
		
        <TouchableOpacity style={styles.detailBtn} activeOpacity={0.82}>
          <Text style={styles.detailBtnText}>상세 보기</Text>
          <Text style={styles.detailBtnArrow}>→</Text>
        </TouchableOpacity>
		*/}
      </ScrollView>

      <AddTaskModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddTask}
      />
    </SafeAreaView>
  );
}

const CARD_BG = '#141720';
const BORDER = '#1F2435';
const ACCENT = '#5B6CF8';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0D14',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0D14',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Screen header (InProgressScreen / TaskDetailScreen)
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backBtnText: {
    fontSize: 15,
    color: '#5B6CF8',
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  headerGreeting: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    flex: 1,
  },
  addTaskBtn: {
    backgroundColor: '#FCFC88',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addTaskBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5b6cf8',
  },
  headerDate: {
    fontSize: 12,
    color: '#374151',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  statCard2: {
    flex: 1,
	backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  statCardAccent: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statValue2: {
	backgroundColor: '#22C55E',
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statValueLight: {
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  statLabel2: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statLabelLight: {
    color: 'rgba(255,255,255,0.75)',
  },

  // Card
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Task row
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: { backgroundColor: '#22C55E' },
  dotAmber: { backgroundColor: '#F59E0B' },
  dotBlue: { backgroundColor: '#5B6CF8' },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 2,
  },
  taskMeta: {
    fontSize: 11,
    color: '#4B5563',
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillGreen: { backgroundColor: 'rgba(34,197,94,0.13)' },
  pillAmber: { backgroundColor: 'rgba(245,158,11,0.13)' },
  pillBlue: { backgroundColor: 'rgba(91,108,248,0.13)' },
  pillText: { fontSize: 12, fontWeight: '600' },
  pillTextGreen: { color: '#22C55E' },
  pillTextAmber: { color: '#F59E0B' },
  pillTextBlue: { color: '#5B6CF8' },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginRight: 8,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1F2435',
    borderWidth: 1,
    borderColor: '#2A2F45',
  },
  filterBtnActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  filterBtnText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },

  // Empty state
  emptyText: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Progress
  progressItemGap: { marginBottom: 16 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trackBg: {
    height: 6,
    backgroundColor: '#1F2435',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Past tasks
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(91,108,248,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '700',
  },
  pastInfo: { flex: 1 },
  pastTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  categoryChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#1F2435',
  },
  categoryText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Detail button (홈 하단 / TaskDetailScreen 저장 버튼 공용)
  detailBtnRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 8,
    gap: 10,
  },
  detailBtn: {
    flex: 1,
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  detailDeleteBtn: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  detailSaveBtn: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
  },
  detailBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  detailBtnArrow: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },

  // TaskDetailScreen
  detailTitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 20,
  },
  detailTitleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: -0.3,
  },
  detailFieldBlock: {
    paddingVertical: 14,
  },
  detailFieldLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  detailFieldValue: {
    fontSize: 15,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  detailFieldValueMuted: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  detailInput: {
    marginBottom: 0,
  },
  detailNotesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  progressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressAdjBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1F2435',
    borderWidth: 1,
    borderColor: '#2A2F45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressAdjBtnText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 24,
  },
  progressInputValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 52,
    textAlign: 'center',
  },
});

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: '85%',
    backgroundColor: '#141720',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F2435',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1F2435',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A2F45',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  datePickerPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  datePickerIcon: {
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 22,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1F2435',
    borderWidth: 1,
    borderColor: '#2A2F45',
  },
  categoryBtnActive: {
    backgroundColor: '#5B6CF8',
    borderColor: '#5B6CF8',
  },
  categoryBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  categoryBtnTextActive: {
    color: '#FFFFFF',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1F2435',
    borderWidth: 1,
    borderColor: '#2A2F45',
  },
  statusBtnActive: {
    backgroundColor: '#5B6CF8',
    borderColor: '#5B6CF8',
  },
  statusBtnText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1F2435',
  },
  cancelText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#5B6CF8',
  },
  saveText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

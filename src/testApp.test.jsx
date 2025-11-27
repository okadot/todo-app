import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoApp from './testApp';

// localStorage のモック
const localStorageMock = (() => {
	let store = {};
	return {
		getItem: (key) => store[key] || null,
		setItem: (key, value) => {
			store[key] = value.toString();
		},
		removeItem: (key) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

describe('TodoApp コンポーネント', () => {
	beforeEach(() => {
		localStorage.clear();
		render(<TodoApp />);
	});

	test('初期状態でタイトルが表示される', () => {
		const title = screen.getByText('業務用Todo管理');
		expect(title).toBeInTheDocument();
	});

	test('初期状態で「タスクはありません」と表示される', () => {
		const emptyMessage = screen.getByText('タスクはありません');
		expect(emptyMessage).toBeInTheDocument();
	});

	test('統計情報が正しく表示される', () => {
		expect(screen.getByRole('heading', { name: '全体' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: '未完了' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: '完了' })).toBeInTheDocument();
	});

	test('タスクを追加できる', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'テストタスク');
		const dateInput = screen.getByLabelText('due-date');
		const prioritySelect = screen.getByLabelText('priority-select');
		fireEvent.change(dateInput, { target: { value: '2025-12-31' } });
		fireEvent.change(prioritySelect, { target: { value: 'High' } });
		fireEvent.click(addButton);

		expect(screen.getByText('テストタスク')).toBeInTheDocument();
	});

	test('空のタスクは追加されない', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, '   ');
		// date/priority not set for empty input
		fireEvent.click(addButton);

		expect(screen.getByText('タスクはありません')).toBeInTheDocument();
	});

	test('タスク追加後、入力フィールドがクリアされる', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'テストタスク');
		const dateInput2 = screen.getByLabelText('due-date');
		const prioritySelect2 = screen.getByLabelText('priority-select');
		fireEvent.change(dateInput2, { target: { value: '2025-12-31' } });
		fireEvent.change(prioritySelect2, { target: { value: 'Medium' } });
		fireEvent.click(addButton);

		expect(input.value).toBe('');
	});

	test('タスクのチェックボックスでタスク完了状態を切り替える', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'テストタスク');
		const dateInput3 = screen.getByLabelText('due-date');
		const prioritySelect3 = screen.getByLabelText('priority-select');
		fireEvent.change(dateInput3, { target: { value: '2025-12-31' } });
		fireEvent.change(prioritySelect3, { target: { value: 'Medium' } });
		fireEvent.click(addButton);

		const checkbox = screen.getByRole('checkbox', { hidden: true });
		fireEvent.click(checkbox);

		const taskText = screen.getByText('テストタスク');
		expect(taskText).toHaveClass('text-muted', 'text-decoration-line-through');
	});

	test('削除ボタンでタスクが削除される', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'テストタスク');
		fireEvent.click(addButton);

		const deleteButton = screen.getByRole('button', { name: /trash/i });
		fireEvent.click(deleteButton);

		expect(screen.queryByText('テストタスク')).not.toBeInTheDocument();
	});

	test('複数のタスクを管理できる', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'タスク1');
		const d1 = screen.getByLabelText('due-date');
		const p1 = screen.getByLabelText('priority-select');
		fireEvent.change(d1, { target: { value: '2025-12-01' } });
		fireEvent.change(p1, { target: { value: 'Low' } });
		fireEvent.click(addButton);

		await userEvent.type(input, 'タスク2');
		fireEvent.change(d1, { target: { value: '2025-12-02' } });
		fireEvent.change(p1, { target: { value: 'Medium' } });
		fireEvent.click(addButton);

		await userEvent.type(input, 'タスク3');
		fireEvent.change(d1, { target: { value: '2025-12-03' } });
		fireEvent.change(p1, { target: { value: 'High' } });
		fireEvent.click(addButton);

		expect(screen.getByText('タスク1')).toBeInTheDocument();
		expect(screen.getByText('タスク2')).toBeInTheDocument();
		expect(screen.getByText('タスク3')).toBeInTheDocument();
	});

	test('フィルタータブで未完了タスクのみ表示できる', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		// 2つのタスクを追加
		await userEvent.type(input, 'タスク1');
		const d2 = screen.getByLabelText('due-date');
		const p2 = screen.getByLabelText('priority-select');
		fireEvent.change(d2, { target: { value: '2025-12-01' } });
		fireEvent.change(p2, { target: { value: 'Low' } });
		fireEvent.click(addButton);

		await userEvent.type(input, 'タスク2');
		fireEvent.change(d2, { target: { value: '2025-12-02' } });
		fireEvent.change(p2, { target: { value: 'Medium' } });
		fireEvent.click(addButton);

		// 1つ目のタスクを完了
		const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
		fireEvent.click(checkboxes[0]);

		// 未完了フィルターをクリック
		const pendingButtons = screen.getAllByRole('button', { name: '未完了' });
		fireEvent.click(pendingButtons[0]);

		expect(screen.getByText('タスク2')).toBeInTheDocument();
		expect(screen.queryByText('タスク1')).not.toBeInTheDocument();
	});

	test('フィルタータブで完了タスクのみ表示できる', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		// 2つのタスクを追加
		await userEvent.type(input, 'タスク1');
		const d3 = screen.getByLabelText('due-date');
		const p3 = screen.getByLabelText('priority-select');
		fireEvent.change(d3, { target: { value: '2025-12-01' } });
		fireEvent.change(p3, { target: { value: 'Low' } });
		fireEvent.click(addButton);

		await userEvent.type(input, 'タスク2');
		fireEvent.change(d3, { target: { value: '2025-12-02' } });
		fireEvent.change(p3, { target: { value: 'Medium' } });
		fireEvent.click(addButton);

		// 1つ目のタスクを完了
		const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
		fireEvent.click(checkboxes[0]);

		// 完了フィルターをクリック
		const completedButtons = screen.getAllByRole('button', { name: '完了' });
		fireEvent.click(completedButtons[0]);

		expect(screen.getByText('タスク1')).toBeInTheDocument();
		expect(screen.queryByText('タスク2')).not.toBeInTheDocument();
	});

	test('統計情報が正しく更新される', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		// 2つのタスクを追加
		await userEvent.type(input, 'タスク1');
		fireEvent.click(addButton);

		await userEvent.type(input, 'タスク2');
		fireEvent.click(addButton);

		// 1つのタスクを完了
		const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
		fireEvent.click(checkboxes[0]);

		// 統計情報を確認（見出しで絞って各バッジを取得）
		const allHeaders = screen.getAllByRole('heading', { level: 5 });
		const totalHeading = allHeaders[0]; // 全体
		const pendingHeading = allHeaders[1]; // 未完了
		const completedHeading = allHeaders[2]; // 完了

		const totalContainer = totalHeading.closest('div').closest('div');
		const pendingContainer = pendingHeading.closest('div').closest('div');
		const completedContainer = completedHeading.closest('div').closest('div');

		const totalBadge = within(totalContainer).getByRole('status');
		const pendingBadge = within(pendingContainer).getByRole('status');
		const completedBadge = within(completedContainer).getByRole('status');

		expect(totalBadge).toHaveTextContent('2');
		expect(pendingBadge).toHaveTextContent('1');
		expect(completedBadge).toHaveTextContent('1');
	});

	test('localStorage にデータが保存される', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'テストタスク');
		const d5 = screen.getByLabelText('due-date');
		const p5 = screen.getByLabelText('priority-select');
		fireEvent.change(d5, { target: { value: '2025-12-31' } });
		fireEvent.change(p5, { target: { value: 'High' } });
		fireEvent.click(addButton);

		const stored = localStorage.getItem('todos');
		expect(stored).not.toBeNull();
		const todos = JSON.parse(stored);
		expect(todos).toHaveLength(1);
		expect(todos[0].text).toBe('テストタスク');
		expect(todos[0].dueDate).toBe('2025-12-31');
		expect(todos[0].priority).toBe('High');
	});

	test('localStorage から データが読み込まれる', () => {
		const testData = [
				{ id: 1, text: '保存されたタスク', completed: false, createdAt: '2025/11/27', dueDate: '2025-12-31', priority: 'High' }
			];
		localStorage.setItem('todos', JSON.stringify(testData));

		render(<TodoApp />);

		expect(screen.getByText('保存されたタスク')).toBeInTheDocument();
	});

	test('完了済みを削除ボタンが完了タスクのみ削除する', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		// 2つのタスクを追加
		await userEvent.type(input, 'タスク1');
		fireEvent.click(addButton);

		await userEvent.type(input, 'タスク2');
		fireEvent.click(addButton);

		// 1つ目のタスクを完了
		const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
		fireEvent.click(checkboxes[0]);

		// 完了済みを削除ボタンをクリック
		const clearButton = screen.getByRole('button', { name: /完了済みを削除/ });
		fireEvent.click(clearButton);

		expect(screen.queryByText('タスク1')).not.toBeInTheDocument();
		expect(screen.getByText('タスク2')).toBeInTheDocument();
	});

	test('期限と優先度を指定してタスクが保存される', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const dateInput = screen.getByLabelText('due-date');
		const prioritySelect = screen.getByLabelText('priority-select');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, '期限付きタスク');
		fireEvent.change(dateInput, { target: { value: '2025-12-31' } });
		fireEvent.change(prioritySelect, { target: { value: 'High' } });
		fireEvent.click(addButton);

		const stored = localStorage.getItem('todos');
		const todos = JSON.parse(stored);
		expect(todos[0].dueDate).toBe('2025-12-31');
		expect(todos[0].priority).toBe('High');
		expect(screen.getByText(/期限: 2025-12-31/)).toBeInTheDocument();
	});

	test('優先度別のバッジが正しく表示される', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const prioritySelect = screen.getByLabelText('priority-select');
		const addButton = screen.getByText('追加');

		// High 優先度タスク
		await userEvent.type(input, 'High タスク');
		fireEvent.change(prioritySelect, { target: { value: 'High' } });
		fireEvent.click(addButton);

		// Medium 優先度タスク（デフォルト）
		await userEvent.type(input, 'Medium タスク');
		fireEvent.change(prioritySelect, { target: { value: 'Medium' } });
		fireEvent.click(addButton);

		// Low 優先度タスク
		await userEvent.type(input, 'Low タスク');
		fireEvent.change(prioritySelect, { target: { value: 'Low' } });
		fireEvent.click(addButton);

		// バッジが表示されていることを確認
		const badges = screen.getAllByRole('status');
		const priorityBadges = badges.filter(badge => 
			badge.textContent === 'High' || 
			badge.textContent === 'Medium' || 
			badge.textContent === 'Low'
		);
		expect(priorityBadges.length).toBeGreaterThanOrEqual(3);
	});

	test('期限と優先度なしでもタスク追加できる', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'シンプルなタスク');
		fireEvent.click(addButton);

		expect(screen.getByText('シンプルなタスク')).toBeInTheDocument();
		const stored = localStorage.getItem('todos');
		const todos = JSON.parse(stored);
		expect(todos[0].dueDate).toBeNull();
		expect(todos[0].priority).toBe('Medium'); // デフォルト値
	});
});

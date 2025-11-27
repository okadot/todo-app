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
		fireEvent.click(addButton);

		expect(screen.getByText('テストタスク')).toBeInTheDocument();
	});

	test('空のタスクは追加されない', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, '   ');
		fireEvent.click(addButton);

		expect(screen.getByText('タスクはありません')).toBeInTheDocument();
	});

	test('タスク追加後、入力フィールドがクリアされる', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'テストタスク');
		fireEvent.click(addButton);

		expect(input.value).toBe('');
	});

	test('タスクのチェックボックスでタスク完了状態を切り替える', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'テストタスク');
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
		fireEvent.click(addButton);

		await userEvent.type(input, 'タスク2');
		fireEvent.click(addButton);

		await userEvent.type(input, 'タスク3');
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
		fireEvent.click(addButton);

		await userEvent.type(input, 'タスク2');
		fireEvent.click(addButton);

		// 1つ目のタスクを完了
		const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
		fireEvent.click(checkboxes[0]);

		// 未完了フィルターをクリック
		const pendingButton = screen.getByRole('button', { name: '未完了' });
		fireEvent.click(pendingButton);

		expect(screen.getByText('タスク2')).toBeInTheDocument();
		expect(screen.queryByText('タスク1')).not.toBeInTheDocument();
	});

	test('フィルタータブで完了タスクのみ表示できる', async () => {
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

		// 完了フィルターをクリック
		const completedButton = screen.getByRole('button', { name: '完了' });
		fireEvent.click(completedButton);

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

		// 統計情報を確認
		const badges = screen.getAllByRole('status');
		expect(badges[0]).toHaveTextContent('2'); // 全体
		expect(badges[1]).toHaveTextContent('1'); // 未完了
		expect(badges[2]).toHaveTextContent('1'); // 完了
	});

	test('localStorage にデータが保存される', async () => {
		const input = screen.getByPlaceholderText('新しいタスクを入力...');
		const addButton = screen.getByText('追加');

		await userEvent.type(input, 'テストタスク');
		fireEvent.click(addButton);

		const stored = localStorage.getItem('todos');
		expect(stored).not.toBeNull();
		const todos = JSON.parse(stored);
		expect(todos).toHaveLength(1);
		expect(todos[0].text).toBe('テストタスク');
	});

	test('localStorage から データが読み込まれる', () => {
		const testData = [
			{ id: 1, text: '保存されたタスク', completed: false, createdAt: '2025/11/27' }
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
});

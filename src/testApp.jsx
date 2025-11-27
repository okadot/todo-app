import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, ListGroup, Badge } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

function TodoApp() {
	const STORAGE_KEY = 'todos';
	const [todos, setTodos] = useState([]);
	const [input, setInput] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [priority, setPriority] = useState('Medium');
	const [filter, setFilter] = useState('all'); // all, completed, pending

	// ローカルストレージから読み込み
	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				setTodos(JSON.parse(saved));
			} catch (e) {
				console.error('Failed to load todos:', e);
			}
		}
	}, []);

	// ローカルストレージに保存
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
	}, [todos]);

	const handleAdd = (e) => {
		e.preventDefault();
		if (!input.trim()) return;
		setTodos([
			...todos,
			{
				id: Date.now(),
				text: input.trim(),
				completed: false,
				createdAt: new Date().toLocaleDateString('ja-JP'),
				dueDate: dueDate || null,
				priority: priority || 'Medium'
			}
		]);
		setInput('');
		setDueDate('');
		setPriority('Medium');
	};

	const handleToggle = (id) => {
		setTodos(todos.map(todo =>
			todo.id === id ? { ...todo, completed: !todo.completed } : todo
		));
	};

	const handleDelete = (id) => {
		setTodos(todos.filter(todo => todo.id !== id));
	};

	const handleClearCompleted = () => {
		setTodos(todos.filter(todo => !todo.completed));
	};

	// フィルタリング
	const filteredTodos = todos.filter(todo => {
		if (filter === 'completed') return todo.completed;
		if (filter === 'pending') return !todo.completed;
		return true;
	});

	const completedCount = todos.filter(t => t.completed).length;
	const pendingCount = todos.filter(t => !t.completed).length;

	return (
		<Container fluid className="bg-light min-vh-100 py-5">
			<Row className="justify-content-center">
				<Col md={8} lg={6}>
					<div className="card shadow-lg">
						<div className="card-header bg-primary text-white py-4">
							<h2 className="mb-0">
								<i className="bi bi-list-check me-2"></i>
								業務用Todo管理
							</h2>
						</div>

						<div className="card-body p-4">
							{/* 統計情報 */}
							<div className="row mb-4">
								<div className="col-6 col-sm-4">
									<div className="text-center">
										<h5 className="text-muted">全体</h5>
										<Badge bg="secondary" role="status">{todos.length}</Badge>
									</div>
								</div>
								<div className="col-6 col-sm-4">
									<div className="text-center">
										<h5 className="text-muted">未完了</h5>
										<Badge bg="warning" role="status">{pendingCount}</Badge>
									</div>
								</div>
								<div className="col-6 col-sm-4">
									<div className="text-center">
										<h5 className="text-muted">完了</h5>
										<Badge bg="success" role="status">{completedCount}</Badge>
									</div>
								</div>
							</div>

							{/* 入力フォーム */}
							<Form onSubmit={handleAdd} className="mb-4">
								<div className="row g-2">
									<div className="col-12 col-md-6">
										<Form.Control
											type="text"
											value={input}
											onChange={e => setInput(e.target.value)}
											placeholder="新しいタスクを入力..."
											className="py-2"
										/>
									</div>
									<div className="col-6 col-md-2">
										<Form.Control
											type="date"
											value={dueDate}
											onChange={e => setDueDate(e.target.value)}
											aria-label="due-date"
										/>
									</div>
									<div className="col-4 col-md-2">
										<Form.Select value={priority} onChange={e => setPriority(e.target.value)} aria-label="priority-select">
											<option value="Low">Low</option>
											<option value="Medium">Medium</option>
											<option value="High">High</option>
										</Form.Select>
									</div>
									<div className="col-2 d-grid">
										<Button variant="primary" type="submit">
											<i className="bi bi-plus-lg me-1"></i>追加
										</Button>
									</div>
								</div>
							</Form>

							{/* フィルタータブ */}
							<div className="btn-group w-100 mb-4" role="group">
								<Button
									variant={filter === 'all' ? 'primary' : 'outline-primary'}
									onClick={() => setFilter('all')}
									className="flex-fill"
								>
									全て
								</Button>
								<Button
									variant={filter === 'pending' ? 'warning' : 'outline-warning'}
									onClick={() => setFilter('pending')}
									className="flex-fill"
								>
									未完了
								</Button>
								<Button
									variant={filter === 'completed' ? 'success' : 'outline-success'}
									onClick={() => setFilter('completed')}
									className="flex-fill"
								>
									完了
								</Button>
							</div>

							{/* Todoリスト */}
							{filteredTodos.length === 0 ? (
								<div className="alert alert-info text-center mb-0">
									<i className="bi bi-inbox me-2"></i>
									タスクはありません
								</div>
							) : (
								<ListGroup as="ul" variant="flush">
									{filteredTodos.map((todo, index) => (
										<ListGroup.Item
											key={todo.id}
											className="d-flex align-items-center justify-content-between py-3 border-bottom"
											style={{
												backgroundColor: todo.completed ? '#f8f9fa' : 'white'
											}}
										>
											<div className="flex-grow-1 d-flex align-items-center">
												<Form.Check
													type="checkbox"
													checked={todo.completed}
													onChange={() => handleToggle(todo.id)}
													className="me-3 mt-0"
													style={{ cursor: 'pointer' }}
												/>
												<div className="flex-grow-1">
													<p
														className={`mb-0 ${todo.completed ? 'text-muted text-decoration-line-through' : ''}`}
														style={{ cursor: 'pointer' }}
														onClick={() => handleToggle(todo.id)}
													>
														{todo.text}
													</p>
													<small className="text-muted d-block">
														{todo.createdAt}
														{todo.dueDate && (
															<>
																&nbsp;•&nbsp;期限: {todo.dueDate}
															</>
														)}
														{todo.priority && (
															<Badge bg={todo.priority === 'High' ? 'danger' : todo.priority === 'Medium' ? 'warning' : 'secondary'} className="ms-2" role="status">
															{todo.priority}
															</Badge>
														)}
													</small>
												</div>
											</div>
											<Button
												variant="danger"
												size="sm"
												aria-label="trash"
												onClick={() => handleDelete(todo.id)}
												className="ms-2"
											>
												<i className="bi bi-trash"></i>
											</Button>
										</ListGroup.Item>
									))}
								</ListGroup>
							)}

							{/* クリアボタン */}
							{completedCount > 0 && (
								<div className="mt-4">
									<Button
										variant="outline-danger"
										size="sm"
										onClick={handleClearCompleted}
										className="w-100"
									>
										<i className="bi bi-check-circle me-1"></i>
										完了済みを削除({completedCount})
									</Button>
								</div>
							)}
						</div>
					</div>
				</Col>
			</Row>
		</Container>
	);
}

export default TodoApp;

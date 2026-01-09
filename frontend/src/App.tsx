import  { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Alert, Button, Card } from 'react-bootstrap';

function App() {
  const [message, setMessage] = useState('Đang kết nối...');

  useEffect(() => {
    axios.get('http://localhost:5000/api')
      .then(res => setMessage(res.data.message))
      .catch(() => setMessage('Lỗi kết nối backend'));
  }, []);

  return (
    <Container className="mt-5">
      <Card className="text-center">
        <Card.Header>
          <h2>WDP301 Project Base (Vite + React)</h2>
        </Card.Header>
        <Card.Body>
          <Alert variant="success">
            <strong>Kết nối backend:</strong> {message}
          </Alert>
          <Button variant="primary" size="lg">
            Vite + React Bootstrap Ready! (Siêu nhanh )
          </Button>
        </Card.Body>
        <Card.Footer className="text-muted">
          Backend: Node.js/Express • Frontend: Vite + React
        </Card.Footer>
      </Card>
    </Container>
  );
}

export default App;
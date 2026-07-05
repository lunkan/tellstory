import { Link, useNavigate } from "react-router-dom";

export function TitleScreen() {
    const navigate = useNavigate();

    async function handleNewGame() {
        navigate('/menu');
    }

    return (
        <div className="title-screen">
            <button className="title-screen--btn" onClick={() => handleNewGame()}>Start</button>
            <div><Link to="/editor">Editor</Link></div>
            <div><Link to="/admin">Admin</Link></div>
        </div>
    );
}
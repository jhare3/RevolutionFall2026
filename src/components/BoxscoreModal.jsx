import React from 'react';
import { Modal, Table, Row, Col, Badge } from 'react-bootstrap';
import { groupStatsByTeam } from '../utils/boxscoreUtils';

const BoxscoreModal = ({ show, onHide, gameData }) => {
  if (!gameData) return null;

  const groupedStats = groupStatsByTeam(gameData.stats || []);
  const t1 = gameData.scores?.team1 || {};
  const t2 = gameData.scores?.team2 || {};
  
  // Look specifically for OT keys in the score object
  const hasOT = t1.OT1 !== undefined || t2.OT1 !== undefined;

  const renderTeamTable = (teamName, players) => (
    <div key={teamName} className="mb-4">
      <h3 className="fw-black bg-dark text-white p-2 h6 d-flex justify-content-between align-items-center italic">
        {teamName} <Badge bg="danger" style={{ fontSize: '10px' }}>STATS</Badge>
      </h3>
      <Table responsive hover size="sm" className="mb-0 border">
        <thead className="table-light small">
          <tr style={{ fontSize: '11px' }}>
            <th className="ps-3">PLAYER</th>
            <th className="text-center">PTS</th>
            <th className="text-center">FG</th>
            <th className="text-center">3PT</th>
            <th className="text-center">FT</th>
            <th className="text-center">REB</th>
            <th className="text-center">AST</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={i} style={{ fontSize: '13px' }}>
              <td className="fw-bold ps-3">{p["Player Name"]}</td>
              <td className="text-center fw-black h6">{p.Points}</td>
              <td className="text-center">{p.FGM}/{p.FGA}</td>
              <td className="text-center">{p["3FGM"]}/{p["3FGA"]}</td>
              <td className="text-center">{p.FTM}/{p.FTA}</td>
              <td className="text-center">{Number(p["Off Reb"] || 0) + Number(p["Def Reb"] || 0)}</td>
              <td className="text-center">{p.Assists}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-dark text-white" data-bs-theme="dark">
        <Modal.Title className="fw-black italic">{gameData.game}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="text-center mb-5 border-bottom pb-4">
          <Row className="align-items-center">
            <Col>
              <div className="h3 fw-black mb-0">{t1.name}</div>
              <div className="display-4 fw-black text-danger">{t1.final}</div>
            </Col>
            <Col xs={2}>
              <Badge bg="secondary" className="px-3 py-2 d-block mb-1">FINAL</Badge>
              {hasOT && <Badge bg="warning" text="dark" style={{ fontSize: '0.65rem' }}>OT</Badge>}
            </Col>
            <Col>
              <div className="h3 fw-black mb-0">{t2.name}</div>
              <div className="display-4 fw-black text-danger">{t2.final}</div>
            </Col>
          </Row>
          <div className="d-flex justify-content-center gap-4 mt-3 small text-muted fw-bold text-uppercase">
            <div>1st: {t1.half1}-{t2.half1}</div>
            <div>2nd: {t1.half2}-{t2.half2}</div>
            {hasOT && <div className="text-danger">OT: {t1.OT1}-{t2.OT1}</div>}
          </div>
          <div className="small text-muted fw-bold mt-2">{gameData.date}</div>
        </div>
        {Object.entries(groupedStats).map(([team, players]) => renderTeamTable(team, players))}
      </Modal.Body>
    </Modal>
  );
};

export default BoxscoreModal;
import React from 'react';
import { Modal, Table, Row, Col, Badge } from 'react-bootstrap';

const TournamentBoxscoreModal = ({ show, onHide, gameData }) => {
  if (!gameData) return null;

  const renderTeamTable = (teamName, players) => {
    const roster = (players || []).filter(p => p['Player Name'] !== 'Totals');
    const totalsRow = (players || []).find(p => p['Player Name'] === 'Totals');

    return (
      <div key={teamName} className="mb-4">
        <h3 className="fw-black bg-dark text-white p-2 h6 d-flex justify-content-between align-items-center italic">
          {teamName}
          <Badge bg="danger" style={{ fontSize: '10px' }}>TEAM TOTALS</Badge>
        </h3>
        <Table responsive hover size="sm" className="mb-0 border">
          <thead className="table-light small">
            <tr style={{ fontSize: '11px' }}>
              <th className="ps-3">PLAYER</th>
              <th className="text-center">PTS</th>
              <th className="text-center">FG</th>
              <th className="text-center">3PT</th>
              <th className="text-center">REB</th>
              <th className="text-center">AST</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((p, i) => (
              <tr key={i} style={{ fontSize: '13px' }}>
                <td className="fw-bold ps-3">{p['Player Name']}</td>
                <td className="text-center fw-black h6">{p.Points}</td>
                <td className="text-center">{p.FGM}/{p.FGA}</td>
                <td className="text-center">{p['3FGM']}/{p['3FGA']}</td>
                <td className="text-center">{Number(p['Off Reb'] || 0) + Number(p['Def Reb'] || 0)}</td>
                <td className="text-center">{p.Assists}</td>
              </tr>
            ))}
            {totalsRow && (
              <tr className="table-dark fw-bold" style={{ fontSize: '13px' }}>
                <td className="ps-3">TOTALS</td>
                <td className="text-center">{totalsRow.Points}</td>
                <td className="text-center">{totalsRow.FGM}/{totalsRow.FGA}</td>
                <td className="text-center">{totalsRow['3FGM']}/{totalsRow['3FGA']}</td>
                <td className="text-center">{Number(totalsRow['Off Reb'] || 0) + Number(totalsRow['Def Reb'] || 0)}</td>
                <td className="text-center">{totalsRow.Assists}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    );
  };

  const visitorScore = gameData.scores?.[gameData.visitors];
  const homeScore = gameData.scores?.[gameData.home];

  // Detect overtime by checking for OT keys
  const visitorScoreKeys = visitorScore ? Object.keys(visitorScore) : [];
  const hasOT = visitorScoreKeys.some(k => k.startsWith('OT'));

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="bg-dark text-white" data-bs-theme="dark">
        <Modal.Title className="fw-black italic">{gameData.game}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="text-center mb-5 border-bottom pb-4">
          <Row className="align-items-center">
            <Col>
              <div className="h3 fw-black mb-0">{gameData.visitors}</div>
              <div className="display-4 fw-black text-danger">{visitorScore?.Total}</div>
            </Col>
            <Col xs={2}>
              <Badge bg="secondary" className="px-3 py-2 d-block mb-1">FINAL</Badge>
              {hasOT && <Badge bg="warning" text="dark" style={{ fontSize: '0.65rem' }}>OT</Badge>}
            </Col>
            <Col>
              <div className="h3 fw-black mb-0">{gameData.home}</div>
              <div className="display-4 fw-black text-danger">{homeScore?.Total}</div>
            </Col>
          </Row>

          {/* Quarter / Half breakdown */}
          <div className="d-flex justify-content-center gap-4 mt-3 small text-muted fw-bold">
            {visitorScoreKeys
              .filter(k => k !== 'Total')
              .map(period => (
                <div key={period} className="text-center">
                  <div className="text-uppercase" style={{ fontSize: '10px' }}>{period}</div>
                  <div>{visitorScore[period]} – {homeScore?.[period]}</div>
                </div>
              ))}
          </div>

          <div className="small text-muted fw-bold mt-3 text-uppercase">{gameData.date}</div>
        </div>

        {renderTeamTable(gameData.visitors, gameData.visitor_stats)}
        {renderTeamTable(gameData.home, gameData.home_stats)}
      </Modal.Body>
    </Modal>
  );
};

export default TournamentBoxscoreModal;
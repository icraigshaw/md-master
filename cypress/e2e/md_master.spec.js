describe('MD Master Plugin', () => {
  const filePath = 'data/CypressTest.md';

  it('opens the plugin window', () => {
    cy.visit('index.html');
    cy.contains('MD Master');
  });

  it('creates, edits, saves and reloads file', () => {
    cy.visit('index.html');

    cy.get('#newFileBtn').click();
    cy.window().then(win => {
      // prompts - stub them
      cy.stub(win, 'prompt')
        .onFirstCall().returns('CypressTest.md')
        .onSecondCall().returns('');
    });
    cy.get('#newFileBtn').click();
    cy.get('#markdownEditor').should('exist');
    cy.get('#markdownEditor').type('Hello Cypress');
    cy.get('#saveBtn').click();

    cy.reload();
    cy.contains('.file-item', 'CypressTest.md').click();
    cy.get('#markdownEditor').should('have.value', 'Hello Cypress');
  });

  it('navigation buttons filter file list', () => {
    cy.visit('index.html');
    cy.get('[data-filter="all"]').click();
    cy.get('#fileList .file-item').its('length').then(allCount => {
      cy.get('[data-filter="recent"]').click();
      cy.get('#fileList .file-item').its('length').should('be.lte', allCount);
    });
  });
});

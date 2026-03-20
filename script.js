var matrices = { A: [], B: [] };
var resultMatrix = null;
var resultScalar = null;
var calcHistory = [];
var currentStep = 0;
var allSteps = [];
var showAllSteps = false;
var isDark = false;

function getRows(m) {
  return parseInt(document.getElementById("rows" + m).value);
}

function getCols(m) {
  return parseInt(document.getElementById("cols" + m).value);
}

function buildMatrix(m) {
  var rows = getRows(m),
    cols = getCols(m);
  var prev = matrices[m];
  var data = [];
  for (var i = 0; i < rows; i++) {
    data.push([]);
    for (var j = 0; j < cols; j++) {
      data[i].push(prev[i] && prev[i][j] !== undefined ? prev[i][j] : "");
    }
  }
  return data;
}

function rebuildMatrix(m) {
  matrices[m] = buildMatrix(m);
  renderMatrix(m);
  hideResults();
}

function renderMatrix(m) {
  var grid = document.getElementById("grid" + m);
  var rows = getRows(m),
    cols = getCols(m);
  grid.style.gridTemplateColumns = "repeat(" + cols + ", minmax(56px, 56px))";
  grid.innerHTML = "";
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      var cell = document.createElement("div");
      cell.className = "cell-wrap";
      var inp = document.createElement("input");
      inp.type = "number";
      inp.className = "matrix-input";
      inp.placeholder = "0";
      inp.value = matrices[m][i][j] !== "" ? matrices[m][i][j] : "";
      inp.dataset.m = m;
      inp.dataset.i = i;
      inp.dataset.j = j;
      inp.addEventListener("focus", onCellFocus);
      inp.addEventListener("blur", onCellBlur);
      inp.addEventListener("input", onCellInput);
      inp.addEventListener("keydown", onCellKeydown);
      inp.addEventListener("wheel", function (e) {
        e.preventDefault();
      });
      cell.appendChild(inp);
      grid.appendChild(cell);
    }
  }
}

function onCellFocus(e) {
  var inp = e.target;
  var m = inp.dataset.m,
    i = parseInt(inp.dataset.i),
    j = parseInt(inp.dataset.j);
  inp.select();
  highlightRowCol(m, i, j);
  document.getElementById("card" + m).classList.add("active");
}

function onCellBlur(e) {
  var m = e.target.dataset.m;
  clearHighlights(m);
  document.getElementById("card" + m).classList.remove("active");
}

function onCellInput(e) {
  var inp = e.target;
  var m = inp.dataset.m,
    i = parseInt(inp.dataset.i),
    j = parseInt(inp.dataset.j);
  var v = inp.value.trim();
  matrices[m][i][j] = v === "" ? "" : parseFloat(v);
  hideResults();
}

function onCellKeydown(e) {
  var inp = e.target;
  var m = inp.dataset.m,
    i = parseInt(inp.dataset.i),
    j = parseInt(inp.dataset.j);
  var rows = getRows(m),
    cols = getCols(m);
  var moved = false;
  if (e.key === "ArrowUp") {
    e.preventDefault();
    i = Math.max(0, i - 1);
    moved = true;
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    i = Math.min(rows - 1, i + 1);
    moved = true;
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    j = Math.max(0, j - 1);
    moved = true;
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    j = Math.min(cols - 1, j + 1);
    moved = true;
  } else if (e.key === "Enter") {
    e.preventDefault();
    i = Math.min(rows - 1, i + 1);
    moved = true;
  }
  if (moved) {
    focusCell(m, i, j);
  }
}

function focusCell(m, i, j) {
  var inputs = document.querySelectorAll("#grid" + m + " .matrix-input");
  var cols = getCols(m);
  var idx = i * cols + j;
  if (inputs[idx]) inputs[idx].focus();
}

function highlightRowCol(m, row, col) {
  clearHighlights(m);
  var inputs = document.querySelectorAll("#grid" + m + " .matrix-input");
  inputs.forEach(function (inp) {
    var ii = parseInt(inp.dataset.i),
      jj = parseInt(inp.dataset.j);
    if (ii === row && jj !== col) inp.classList.add("row-highlight");
    if (jj === col && ii !== row) inp.classList.add("col-highlight");
  });
}

function clearHighlights(m) {
  document
    .querySelectorAll("#grid" + m + " .matrix-input")
    .forEach(function (inp) {
      inp.classList.remove("row-highlight", "col-highlight");
    });
}

function getMatrixValues(m) {
  var rows = getRows(m),
    cols = getCols(m);
  var data = [];
  for (var i = 0; i < rows; i++) {
    data.push([]);
    for (var j = 0; j < cols; j++) {
      var v = matrices[m][i][j];
      data[i].push(v === "" ? 0 : parseFloat(v));
    }
  }
  return data;
}

function onOpChange() {
  var op = document.getElementById("opSelect").value;
  document.getElementById("scalarWrap").style.display =
    op === "scalar" ? "flex" : "none";
  document.getElementById("powerWrap").style.display =
    op === "power" ? "flex" : "none";
  hideResults();
  updateWorkspaceLayout(op);
}

function updateWorkspaceLayout(op) {
  var hideBOps = ["transpose", "determinant", "inverse", "scalar", "power"];
  var cardB = document.getElementById("cardB");
  if (hideBOps.indexOf(op) >= 0) {
    cardB.style.display = "none";
    document.getElementById("workspace").style.gridTemplateColumns = "1fr";
  } else {
    cardB.style.display = "";
    document.getElementById("workspace").style.gridTemplateColumns = "";
  }
}

function hideResults() {
  document.getElementById("resultSection").classList.remove("visible");
  document.getElementById("errorCard").classList.remove("visible");
  document.getElementById("statusBar").classList.remove("visible");
}

function showError(title, msg) {
  document.getElementById("errorTitle").textContent = title;
  document.getElementById("errorMsg").textContent = msg;
  document.getElementById("errorCard").classList.add("visible");
  document.getElementById("resultSection").classList.remove("visible");
}

function fmtNum(v) {
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  return parseFloat(v.toFixed(4)).toString();
}

function setStatus(msg) {
  var bar = document.getElementById("statusBar");
  bar.textContent = msg;
  bar.classList.add("visible");
}

function compute() {
  var op = document.getElementById("opSelect").value;
  var btn = document.getElementById("computeBtn");
  btn.classList.add("loading");
  btn.disabled = true;
  hideResults();
  setStatus("Computing…");
  setTimeout(function () {
    try {
      doCompute(op);
    } catch (err) {
      showError("Computation error", err.message);
    }
    btn.classList.remove("loading");
    btn.disabled = false;
    document.getElementById("statusBar").classList.remove("visible");
  }, 250);
}

function doCompute(op) {
  var A = getMatrixValues("A");
  var rowsA = A.length,
    colsA = A[0].length;

  if (op === "multiply") {
    var B = getMatrixValues("B");
    var rowsB = B.length,
      colsB = B[0].length;
    if (colsA !== rowsB) {
      showError(
        "Dimension mismatch",
        "A is " +
          rowsA +
          "×" +
          colsA +
          " and B is " +
          rowsB +
          "×" +
          colsB +
          ". Columns of A must equal rows of B.",
      );
      return;
    }
    var C = [],
      steps = [];
    for (var i = 0; i < rowsA; i++) {
      C.push([]);
      for (var j = 0; j < colsB; j++) {
        var sum = 0,
          terms = [];
        for (var k = 0; k < colsA; k++) {
          sum += A[i][k] * B[k][j];
          terms.push([A[i][k], B[k][j]]);
        }
        C[i].push(sum);
        steps.push({
          cell: "(" + i + "," + j + ")",
          row: i,
          col: j,
          terms: terms,
          result: sum,
        });
      }
    }
    displayResult(C, "A × B", steps, A, B, rowsA, colsB, "multiply");
  } else if (op === "add" || op === "subtract") {
    var B = getMatrixValues("B");
    if (rowsA !== B.length || colsA !== B[0].length) {
      showError(
        "Dimension mismatch",
        "Both matrices must have same dimensions. A is " +
          rowsA +
          "×" +
          colsA +
          ", B is " +
          B.length +
          "×" +
          B[0].length +
          ".",
      );
      return;
    }
    var sym = op === "add" ? "+" : "−";
    var C = [],
      steps = [];
    for (var i = 0; i < rowsA; i++) {
      C.push([]);
      for (var j = 0; j < colsA; j++) {
        var v = op === "add" ? A[i][j] + B[i][j] : A[i][j] - B[i][j];
        C[i].push(v);
        steps.push({
          cell: "(" + i + "," + j + ")",
          row: i,
          col: j,
          a: A[i][j],
          b: B[i][j],
          sym: sym,
          result: v,
          type: "elementwise",
        });
      }
    }
    displayResult(C, "A " + sym + " B", steps, A, B, rowsA, colsA, op);
  } else if (op === "transpose") {
    var C = [];
    for (var i = 0; i < colsA; i++) {
      C.push([]);
      for (var j = 0; j < rowsA; j++) {
        C[i].push(A[j][i]);
      }
    }
    displayResult(C, "Aᵀ", [], A, null, colsA, rowsA, "transpose");
  } else if (op === "determinant") {
    var d = determinant(A);
    if (rowsA !== colsA) {
      showError("Not a square matrix", "Determinant only defined for square matrices.");
      return;
    }
    resultMatrix = [[d]];
    resultScalar = d;
    displayScalarResult(d, "det(A) = " + fmtNum(d));
    addHistory("det(A)", [[d]], true);
  } else if (op === "inverse") {
    if (rowsA !== colsA) {
      showError("Not a square matrix", "Inverse only defined for square matrices.");
      return;
    }
    var d = determinant(A);
    if (Math.abs(d) < 1e-10) {
      showError("Singular matrix", "Determinant is zero. Matrix is not invertible.");
      return;
    }
    var C = inverse(A);
    displayResult(C, "A⁻¹", [], A, null, rowsA, colsA, "inverse");
  } else if (op === "scalar") {
    var k = parseFloat(document.getElementById("scalarK").value);
    var C = [];
    var steps = [];
    for (var i = 0; i < rowsA; i++) {
      C.push([]);
      for (var j = 0; j < colsA; j++) {
        var v = k * A[i][j];
        C[i].push(v);
        steps.push({
          cell: "(" + i + "," + j + ")",
          row: i,
          col: j,
          k: k,
          a: A[i][j],
          result: v,
          type: "scalar",
        });
      }
    }
    displayResult(C, k + " × A", steps, A, null, rowsA, colsA, "scalar");
  } else if (op === "power") {
    var n = parseInt(document.getElementById("powerN").value);
    if (rowsA !== colsA) {
      showError("Not a square matrix", "Power only defined for square matrices.");
      return;
    }
    if (n < 0) {
      showError("Invalid exponent", "Exponent must be non-negative.");
      return;
    }
    var C = matrixPower(A, n);
    displayResult(C, "A" + (n === 1 ? "" : "^" + n), [], A, null, rowsA, colsA, "power");
  }
}

function determinant(A) {
  var n = A.length;
  if (n !== A[0].length) throw new Error("Matrix must be square");
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  var det = 0;
  for (var j = 0; j < n; j++) {
    det += Math.pow(-1, j) * A[0][j] * determinant(minor(A, 0, j));
  }
  return det;
}

function minor(A, row, col) {
  return A.filter(function (_, i) {
    return i !== row;
  }).map(function (r) {
    return r.filter(function (_, j) {
      return j !== col;
    });
  });
}

function inverse(A) {
  var n = A.length;
  var d = determinant(A);
  if (Math.abs(d) < 1e-10) throw new Error("Matrix is singular");
  var adj = adjugate(A);
  return adj.map(function (row) {
    return row.map(function (v) {
      return v / d;
    });
  });
}

function adjugate(A) {
  var n = A.length;
  var cof = [];
  for (var i = 0; i < n; i++) {
    cof[i] = [];
    for (var j = 0; j < n; j++) {
      cof[i][j] =
        Math.pow(-1, i + j) * determinant(minor(A, i, j));
    }
  }
  return transpose(cof);
}

function transpose(A) {
  var n = A.length,
    m = A[0].length;
  var C = [];
  for (var i = 0; i < m; i++) {
    C[i] = [];
    for (var j = 0; j < n; j++) {
      C[i][j] = A[j][i];
    }
  }
  return C;
}

function matrixPower(A, n) {
  if (n === 0) {
    var m = A.length;
    var I = [];
    for (var i = 0; i < m; i++) {
      I[i] = [];
      for (var j = 0; j < m; j++) {
        I[i][j] = i === j ? 1 : 0;
      }
    }
    return I;
  }
  var result = A.map(function (row) {
    return row.slice();
  });
  for (var i = 1; i < n; i++) {
    result = multiply(result, A);
  }
  return result;
}

function multiply(A, B) {
  var rowsA = A.length,
    colsA = A[0].length;
  var colsB = B[0].length;
  var C = [];
  for (var i = 0; i < rowsA; i++) {
    C[i] = [];
    for (var j = 0; j < colsB; j++) {
      var sum = 0;
      for (var k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}

function displayResult(C, opLabel, steps, A, B, outRows, outCols, op) {
  resultMatrix = C;
  resultScalar = null;
  allSteps = steps;
  currentStep = 0;

  var grid = document.getElementById("resultGrid");
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = "repeat(" + outCols + ", 1fr)";
  
  for (var i = 0; i < outRows; i++) {
    for (var j = 0; j < outCols; j++) {
      var v = C[i][j];
      var cell = document.createElement("div");
      cell.className = "result-cell";
      cell.dataset.i = i;
      cell.dataset.j = j;
      cell.textContent = fmtNum(v);
      cell.onmouseover = function (e) {
        updateSourceHighlights(
          parseInt(e.target.dataset.i),
          parseInt(e.target.dataset.j),
          A,
          B,
          op,
        );
      };
      cell.onmouseout = function () {
        clearSourceHighlights();
        currentStep = 0;
        renderCurrentStep();
      };
      grid.appendChild(cell);
    }
  }

  document.getElementById("resultOp").textContent = opLabel;
  document.getElementById("resultDimLabel").textContent = outRows + " × " + outCols;

  if (steps.length > 0) {
    document.getElementById("hoverHint").style.display = "block";
    renderCurrentStep();
  } else {
    document.getElementById("stepsPanel").innerHTML = '';
    document.getElementById("hoverHint").style.display = "none";
  }

  document.getElementById("resultSection").classList.add("visible");
  addHistory(opLabel, C, false);
}

function displayScalarResult(val, text) {
  var grid = document.getElementById("resultGrid");
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = "1fr";
  var cell = document.createElement("div");
  cell.className = "result-cell";
  cell.textContent = fmtNum(val);
  grid.appendChild(cell);

  document.getElementById("resultOp").textContent = text;
  document.getElementById("resultDimLabel").textContent = "1 × 1";
  document.getElementById("stepsPanel").innerHTML = '';
  document.getElementById("hoverHint").style.display = "none";
  document.getElementById("resultSection").classList.add("visible");
}

function updateSourceHighlights(i, j, A, B, op) {
  clearSourceHighlights();
  document.querySelectorAll(".result-cell").forEach(function (cell) {
    cell.classList.remove("active");
  });
  document.querySelectorAll(".result-cell").forEach(function (cell) {
    if (parseInt(cell.dataset.i) === i && parseInt(cell.dataset.j) === j) {
      cell.classList.add("active");
    }
  });

  // Find the step for this cell and display it
  var stepIndex = -1;
  for (var k = 0; k < allSteps.length; k++) {
    if (allSteps[k].row === i && allSteps[k].col === j) {
      stepIndex = k;
      break;
    }
  }

  if (stepIndex !== -1) {
    currentStep = stepIndex;
    renderStepForCell(i, j, A, B, op);
  }

  if (op === "multiply") {
    highlightRowCol("A", i, -1);
    highlightRowCol("B", -1, j);
  } else if (op === "add" || op === "subtract" || op === "scalar") {
    highlightRowCol("A", i, j);
    highlightRowCol("B", i, j);
  } else if (op === "transpose") {
    highlightRowCol("A", j, i);
  }
}

function renderStepForCell(i, j, A, B, op) {
  var step = allSteps[currentStep];
  if (!step) return;

  var panel = document.getElementById("stepsPanel");
  var panelLabel = allSteps.length === 1 ? "Step" : "Steps";
  var html =
    '<div class="steps-header">' +
    '<span class="steps-title">' + panelLabel + ' (' + allSteps.length + ')</span>' +
    '<div class="steps-nav">' +
    '<button class="step-nav-btn" onclick="prevStep()" ' +
    (currentStep <= 0 ? "disabled" : "") +
    ">&lsaquo;</button>" +
    '<span class="step-counter">' +
    (currentStep + 1) +
    " / " +
    allSteps.length +
    "</span>" +
    '<button class="step-nav-btn" onclick="nextStep()" ' +
    (currentStep >= allSteps.length - 1 ? "disabled" : "") +
    ">&rsaquo;</button>" +
    "</div></div>";

  html +=
    '<div class="step-block"><div class="step-cell-label">cell ' +
    step.cell +
    '</div><div class="step-formula">';

  if (step.terms) {
    var exprParts = step.terms.map(function (t) {
      return (
        '<span class="term-a">' +
        fmtNum(t[0]) +
        '</span><span class="op">&times;</span><span class="term-b">' +
        fmtNum(t[1]) +
        "</span>"
      );
    });
    html += exprParts.join('<span class="op"> + </span>');
    html +=
      '<br><span class="op">= </span><span class="result">' +
      fmtNum(step.result) +
      "</span>";
  } else if (step.type === "elementwise") {
    html +=
      '<span class="term-a">' +
      fmtNum(step.a) +
      '</span><span class="op"> ' +
      step.sym +
      ' </span><span class="term-b">' +
      fmtNum(step.b) +
      '</span><br><span class="op">= </span><span class="result">' +
      fmtNum(step.result) +
      "</span>";
  } else if (step.type === "scalar") {
    html +=
      '<span class="term-b">' +
      fmtNum(step.k) +
      '</span><span class="op"> &times; </span><span class="term-a">' +
      fmtNum(step.a) +
      '</span><br><span class="op">= </span><span class="result">' +
      fmtNum(step.result) +
      "</span>";
  }

  html += "</div></div>";
  panel.innerHTML = html;
}

function clearSourceHighlights() {
  clearHighlights("A");
  clearHighlights("B");
}

function renderCurrentStep() {
  var step = allSteps[currentStep];
  if (!step) return;

  var panel = document.getElementById("stepsPanel");
  var panelLabel = allSteps.length === 1 ? "Step" : "Steps";
  var html =
    '<div class="steps-header">' +
    '<span class="steps-title">' + panelLabel + ' (' + allSteps.length + ')</span>' +
    '<div class="steps-nav">' +
    '<button class="step-nav-btn" onclick="prevStep()" ' +
    (currentStep <= 0 ? "disabled" : "") +
    ">&lsaquo;</button>" +
    '<span class="step-counter">' +
    (currentStep + 1) +
    " / " +
    allSteps.length +
    "</span>" +
    '<button class="step-nav-btn" onclick="nextStep()" ' +
    (currentStep >= allSteps.length - 1 ? "disabled" : "") +
    ">&rsaquo;</button>" +
    "</div></div>";

  html +=
    '<div class="step-block"><div class="step-cell-label">cell ' +
    step.cell +
    '</div><div class="step-formula">';

  if (step.terms) {
    var exprParts = step.terms.map(function (t) {
      return (
        '<span class="term-a">' +
        fmtNum(t[0]) +
        '</span><span class="op">&times;</span><span class="term-b">' +
        fmtNum(t[1]) +
        "</span>"
      );
    });
    html += exprParts.join('<span class="op"> + </span>');
    html +=
      '<br><span class="op">= </span><span class="result">' +
      fmtNum(step.result) +
      "</span>";
  } else if (step.type === "elementwise") {
    html +=
      '<span class="term-a">' +
      fmtNum(step.a) +
      '</span><span class="op"> ' +
      step.sym +
      ' </span><span class="term-b">' +
      fmtNum(step.b) +
      '</span><br><span class="op">= </span><span class="result">' +
      fmtNum(step.result) +
      "</span>";
  } else if (step.type === "scalar") {
    html +=
      '<span class="term-b">' +
      fmtNum(step.k) +
      '</span><span class="op"> &times; </span><span class="term-a">' +
      fmtNum(step.a) +
      '</span><br><span class="op">= </span><span class="result">' +
      fmtNum(step.result) +
      "</span>";
  }

  html += "</div></div>";
  panel.innerHTML = html;
  scrollResultCell();
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    renderCurrentStep();
  }
}

function nextStep() {
  if (currentStep < allSteps.length - 1) {
    currentStep++;
    renderCurrentStep();
  }
}

function scrollResultCell() {
  var step = allSteps[currentStep];
  if (!step) return;
  document.querySelectorAll(".result-cell").forEach(function (cell) {
    cell.classList.remove("active");
    if (
      parseInt(cell.dataset.i) === step.row &&
      parseInt(cell.dataset.j) === step.col
    )
      cell.classList.add("active");
  });
  clearHighlights("A");
  clearHighlights("B");
  document.querySelectorAll("#gridA .matrix-input").forEach(function (inp) {
    if (parseInt(inp.dataset.i) === step.row)
      inp.classList.add("row-highlight");
  });
  document.querySelectorAll("#gridB .matrix-input").forEach(function (inp) {
    if (parseInt(inp.dataset.j) === step.col)
      inp.classList.add("col-highlight");
  });
}

function randomFill(m) {
  var rows = getRows(m),
    cols = getCols(m);
  matrices[m] = Array.from({ length: rows }, function () {
    return Array.from({ length: cols }, function () {
      return Math.floor(Math.random() * 9) + 1;
    });
  });
  renderMatrix(m);
  hideResults();
}

function identityFill(m) {
  var n = Math.min(getRows(m), getCols(m));
  matrices[m] = Array.from({ length: getRows(m) }, function (_, i) {
    return Array.from({ length: getCols(m) }, function (_, j) {
      return i === j && i < n ? 1 : 0;
    });
  });
  renderMatrix(m);
  hideResults();
}

function clearMatrix(m) {
  var rows = getRows(m),
    cols = getCols(m);
  matrices[m] = Array.from({ length: rows }, function () {
    return Array.from({ length: cols }, function () {
      return "";
    });
  });
  renderMatrix(m);
  hideResults();
}

function resetAll() {
  clearMatrix("A");
  clearMatrix("B");
  document.getElementById("opSelect").value = "multiply";
  onOpChange();
  hideResults();
}

function addHistory(label, mat, isScalar) {
  var preview = isScalar
    ? fmtNum(mat[0][0])
    : mat
        .map(function (r) {
          return "[" + r.map(fmtNum).join(", ") + "]";
        })
        .join("; ");
  var now = new Date();
  var time =
    now.getHours() +
    ":" +
    (now.getMinutes() < 10 ? "0" : "") +
    now.getMinutes();
  calcHistory.unshift({
    label: label,
    preview: preview,
    time: time,
    mat: mat.map(function (r) {
      return r.slice();
    }),
    isScalar: isScalar,
  });
  if (calcHistory.length > 10) calcHistory.pop();
  renderHistory();
}

function renderHistory() {
  var sec = document.getElementById("historySection");
  var list = document.getElementById("historyList");
  if (calcHistory.length === 0) {
    sec.style.display = "none";
    return;
  }
  sec.style.display = "block";
  list.innerHTML = calcHistory
    .map(function (h, idx) {
      return (
        '<div class="history-item" onclick="loadHistory(' +
        idx +
        ')">' +
        '<span class="history-op">' +
        h.label +
        "</span>" +
        '<span class="history-preview">' +
        h.preview +
        "</span>" +
        '<span class="history-time">' +
        h.time +
        "</span>" +
        "</div>"
      );
    })
    .join("");
}

function loadHistory(idx) {
  var h = calcHistory[idx];
  var text = h.isScalar
    ? h.label + " = " + fmtNum(h.mat[0][0])
    : h.label +
      "\n" +
      h.mat
        .map(function (r) {
          return r.map(fmtNum).join("\t");
        })
        .join("\n");
  alert(text);
}

function toggleHistory() {
  var list = document.getElementById("historyList");
  var arrow = document.getElementById("histArrow");
  list.classList.toggle("open");
  arrow.classList.toggle("open");
}

function copyResult() {
  if (!resultMatrix) return;
  var text = resultMatrix
    .map(function (r) {
      return r.map(fmtNum).join("\t");
    })
    .join("\n");
  navigator.clipboard.writeText(text).then(function () {
    var b = document.getElementById("copyBtn");
    var orig = b.textContent;
    b.textContent = "copied!";
    setTimeout(function () {
      b.textContent = orig;
    }, 1500);
  });
}

function downloadJSON() {
  if (!resultMatrix) return;
  var blob = new Blob([JSON.stringify({ result: resultMatrix }, null, 2)], {
    type: "application/json",
  });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "matrix_result.json";
  a.click();
}

function downloadText() {
  if (!resultMatrix) return;
  var text = resultMatrix
    .map(function (r) {
      return r.map(fmtNum).join("\t");
    })
    .join("\n");
  var blob = new Blob([text], { type: "text/plain" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "matrix_result.txt";
  a.click();
}

function toggleDark() {
  isDark = !isDark;
  document.body.setAttribute("data-dark", isDark ? "true" : "false");
  document.getElementById("darkToggle").textContent = isDark
    ? "light mode"
    : "dark mode";
  try {
    localStorage.setItem("mc_dark", isDark ? "1" : "0");
  } catch (e) {}
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.target.matches(".matrix-input,select,button")) {
    compute();
  }
  if (
    e.key.toLowerCase() === "r" &&
    !e.target.matches("input,select,textarea")
  ) {
    resetAll();
  }
  if (
    (e.ctrlKey || e.metaKey) &&
    e.key === "c" &&
    !e.target.matches(".matrix-input")
  ) {
    copyResult();
  }
});

matrices.A = Array.from({ length: 2 }, function () {
  return Array.from({ length: 2 }, function () {
    return "";
  });
});
matrices.B = Array.from({ length: 2 }, function () {
  return Array.from({ length: 2 }, function () {
    return "";
  });
});
renderMatrix("A");
renderMatrix("B");
onOpChange();

try {
  if (localStorage.getItem("mc_dark") === "1") toggleDark();
} catch (e) {}

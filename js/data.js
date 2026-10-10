/* All numbers on this page come from the paper's tables (experiments.tex).
   Success rates are closed-loop SR (%) over 20 seeded rollouts per task. */
window.BWA_DATA = {
  tasks: {
    robofactory: [
      { key: "LB", name: "Lift Barrier", robots: 2 },
      { key: "CA", name: "Camera Alignment", robots: 3 },
      { key: "LP", name: "Long Pipeline Delivery", robots: 4 },
      { key: "TP", name: "Take Photo", robots: 4 },
      { key: "PS", name: "Pass Shoe", robots: 2 },
      { key: "PF", name: "Place Food", robots: 2 }
    ],
    mars: [
      { key: "PC", name: "Place Cube in Cup", robots: 2 },
      { key: "SC", name: "Strike Cube Hard", robots: 2 },
      { key: "TS", name: "Three Robots Place Shoes", robots: 3 },
      { key: "FS", name: "Four Robots Stack Cube", robots: 4 }
    ]
  },
  /* Table I. group: "scratch" = without external robot-action pretraining,
     "pretrained" = with external robot-action pretraining. */
  main: [
    { name: "ACT",              group: "scratch",    rf: [90, 50, 80,   0,   5, 100], rfAvg: 54.17, mars: [30, 45, 15,  0], marsAvg: 22.50, mean: 38.33 },
    { name: "Diffusion Policy", group: "scratch",    rf: [65, 20,  0,   5,   0,  35], rfAvg: 20.83, mars: [ 0,  0,  0,  0], marsAvg:  0.00, mean: 10.42 },
    { name: "LatentToM",        group: "scratch",    rf: [100, 35, 95, 35,  95,  75], rfAvg: 72.50, mars: [30, 35,  0,  0], marsAvg: 16.25, mean: 44.38, adapted: true },
    { name: "GauDP",            group: "scratch",    rf: [70, 10,  0,   0,   0,  70], rfAvg: 25.00, mars: [ 0,  0,  0,  0], marsAvg:  0.00, mean: 12.50, adapted: true },
    { name: "ManiFlow",         group: "scratch",    rf: [75, 50,  0,  40,  20,  70], rfAvg: 42.50, mars: [25, 35,  0,  0], marsAvg: 15.00, mean: 28.75 },
    { name: "RDT-1B",           group: "pretrained", rf: [35, 25,  0,  40,  20,  60], rfAvg: 30.00, mars: [15, 35, 10,  0], marsAvg: 15.00, mean: 22.50 },
    { name: "OpenVLA-OFT",      group: "pretrained", rf: [10, 55,  0,  15,   0,  15], rfAvg: 15.83, mars: [ 0,  0,  0,  0], marsAvg:  0.00, mean:  7.92 },
    { name: "π₀.₅",             group: "pretrained", rf: [85, 65, 55,  65,  70,  15], rfAvg: 59.17, mars: [15, 55, 15,  0], marsAvg: 21.25, mean: 40.21 },
    { name: "CARE (ours)",      group: "ours",       rf: [100, 60, 90, 100, 100, 65], rfAvg: 85.83, mars: [15, 95, 10, 20], marsAvg: 35.00, mean: 60.42, ours: true }
  ],
  /* Table III(a): proposals / selector, fixed candidate set. */
  selection: [
    { name: "Perturbed / CARE",   sr: 84.2, recov: 0.450, regret: 0.0055, or: 6.5 },
    { name: "CARE / Random",      sr: 63.3, recov: 0.140, regret: 0.0086, or: 96.7 },
    { name: "CARE / Direct-only", sr: 80.0, recov: 0.040, regret: 0.0096, or: 42.0 },
    { name: "CARE / Total-only",  sr: 81.7, recov: 0.280, regret: 0.0072, or: 28.0 },
    { name: "CARE / CARE",        sr: 85.8, recov: 0.520, regret: 0.0048, or: 6.0, ours: true }
  ],
  /* Table III(b): evaluator supervision variants, shared proposals. */
  supervision: [
    { name: "Total only (A)",           sr: 81.7, rmae: null, rank: 0.548, regret: 0.0072 },
    { name: "Total + direct (A+D)",     sr: 83.3, rmae: 0.0310, rank: 0.571, regret: 0.0059 },
    { name: "Total + branch utilities", sr: 85.0, rmae: 0.0610, rank: 0.603, regret: 0.0061 },
    { name: "Direct only (D)",          sr: 80.8, rmae: null, rank: 0.452, regret: 0.0083 },
    { name: "Unmatched branches",       sr: 78.3, rmae: 0.1290, rank: 0.438, regret: 0.0096 },
    { name: "CARE w/o coherence",       sr: 84.2, rmae: 0.0520, rank: 0.587, regret: 0.0057 },
    { name: "CARE (full)",              sr: 85.8, rmae: 0.0140, rank: 0.671, regret: 0.0048, ours: true }
  ],
  /* Table IV: selection rules on the same trained scorer. */
  selector: [
    { name: "Nominal path (selector off)",  or: 0.0,  sr: 80.8 },
    { name: "Posterior mean",               or: 98.0, sr: 42.5 },
    { name: "Uncalibrated lower quantile",  or: 38.0, sr: 78.3 },
    { name: "Candidate-wise calibration",   or: 18.0, sr: 89.2 },
    { name: "Simultaneous calibration",     or: 6.0,  sr: 85.8 },
    { name: "CARE (+ safety filter)",       or: 6.0,  sr: 85.8, ours: true }
  ],
  /* Table V: physical dual-robot evaluation, 20 trials per task. */
  real: [
    { name: "ACT",   fb: 12, ob: 10, avg: 55.0, or: null },
    { name: "π₀.₅",  fb: 9,  ob: 14, avg: 57.5, or: null },
    { name: "CARE, selector off", fb: 18, ob: 15, avg: 82.5, or: 0.0 },
    { name: "CARE", fb: 20, ob: 17, avg: 92.5, or: 5.8, ours: true }
  ]
};

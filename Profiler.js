/**
 * Uma classe auxiliar para rastrear as métricas de um único evento de profiler.
 */
class ProfilerEntry {
  constructor(name) {
    this.name = name;
    this.count = 0;
    this.time = 0; // O tempo total será armazenado em milissegundos
    this.running = false;
    this.startTime = 0;
  }

  start() {
    if (this.running) {
      console.warn(`Warning: Starting profiler "${this.name}" that is already running.`);
      return;
    }
    this.startTime = performance.now();
    this.running = true;
    this.count++;
  }

  stop() {
    if (!this.running) {
      console.warn(`Warning: Stopping profiler "${this.name}" that is not running.`);
      return;
    }
    this.time += performance.now() - this.startTime;
    this.running = false;
  }
}

/**
 * Uma classe de profiler para medir o tempo de execução de diferentes seções de código.
 */
class Profiler {
  constructor() {
    this.entries = new Map();
  }

  /**
   * Inicia o cronômetro para um evento nomeado.
   * @param {string} name - O nome do evento a ser medido.
   */
  start(name) {
    if (!this.entries.has(name)) {
      this.entries.set(name, new ProfilerEntry(name));
    }
    const entry = this.entries.get(name);
    entry.start();
  }

  /**
   * Para o cronômetro para um evento nomeado.
   * @param {string} name - O nome do evento a ser parado.
   */
  stop(name) {
    if (!this.entries.has(name)) {
      console.warn(`Warning: Stopping a profiler ("${name}") that was never started.`);
      return;
    }
    const entry = this.entries.get(name);
    entry.stop();
  }

  /**
   * Exibe um relatório formatado no console com todas as métricas coletadas.
   */
  report() {
    // Função auxiliar para formatar números com separadores de milhar e casas decimais
    const formatNumber = (num, decimalPlaces) => {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
    };

    console.log("--------------+---------------+-------------+---------+-----------------------------------");
    console.log("  Total Time  |   Avg Time    |    Count    | Running |  Name");
    console.log("--------------+---------------+-------------+---------+-----------------------------------");

    for (const [name, entry] of this.entries) {
      const totalTimeStr = (formatNumber(entry.time, 2) + " ms").padStart(13);
      const avgTimeStr = (formatNumber(entry.time / entry.count, 2) + " ms").padStart(13);
      const countStr = formatNumber(entry.count, 0).padStart(11);
      const runningStr = String(entry.running).padEnd(7);

      console.log(`${totalTimeStr} | ${avgTimeStr} | ${countStr} | ${runningStr} | ${name}`);
    }
    console.log("--------------+---------------+-------------+---------+-----------------------------------");
  }
}
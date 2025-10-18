// src/components/AntiDevTools.jsx - VERSÃO APRIMORADA E AGRESSIVA

import { useEffect } from 'react';

const AntiDevTools = () => {
    useEffect(() => {
        // --- CONFIGURAÇÃO ---
        const videoUrl = 'https://youtu.be/AY8iaMcum8Y?si=G1159d4YMWfSujLT'; // <-- COLOQUE SEU VÍDEO AQUI
        const detectionInterval = 500; // Intervalo em milissegundos para as verificações

        // --- A ARMADILHA FINAL ---
        // Função que é acionada quando uma detecção ocorre.
        const triggerTrap = () => {
            // Congela o navegador com um loop infinito antes de redirecionar
            const startTime = performance.now();
            while (performance.now() - startTime < 500) {
                // Queima CPU por meio segundo para travar a aba
            }
            // Redireciona para a URL definida
            window.location.href = videoUrl;
        };

        // --- DETECÇÃO 1: ATALHOS DE TECLADO E CLIQUE DIREITO (BÁSICO) ---
        const handleKeydown = (e) => {
            // Bloqueia F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'U')
            ) {
                e.preventDefault();
                triggerTrap();
            }
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
            triggerTrap();
        };

        window.addEventListener('keydown', handleKeydown);
        window.addEventListener('contextmenu', handleContextMenu);

        // --- DETECÇÃO 2: ARMADILHA DE DEBUGGER (A MAIS EFETIVA) ---
        // Esta é a técnica mais poderosa. Ela mede o tempo que o código leva para executar.
        // Se o dev tools estiver aberto, a instrução `debugger;` pausa a execução,
        // aumentando drasticamente o tempo medido.
        const checkDebugger = () => {
            const startTime = performance.now();
            // A mágica acontece aqui. Se o painel estiver aberto, o código pausa.
            debugger;
            const endTime = performance.now();

            // Se a diferença de tempo for maior que 100ms, é 99% de certeza que o dev tools está aberto.
            if (endTime - startTime > 100) {
                triggerTrap();
            }
        };

        // --- DETECÇÃO 3: VERIFICAÇÃO DE TAMANHO DA JANELA ---
        // Detecta se o painel está aberto como uma janela acoplada (docked).
        const checkWindowSize = () => {
            if (
                window.outerWidth - window.innerWidth > 160 ||
                window.outerHeight - window.innerHeight > 160
            ) {
                triggerTrap();
            }
        };

        // --- DETECÇÃO 4: ARMADILHA DE INSPEÇÃO DO CONSOLE ---
        // Cria um objeto especial. Quando o console tenta "ler" suas propriedades para exibi-las,
        // o 'getter' é acionado, ativando nossa armadilha.
        const consoleTrap = document.createElement('div');
        Object.defineProperty(consoleTrap, 'id', {
            get: () => {
                triggerTrap();
                return 'busted'; // Retorna um valor qualquer
            }
        });

        const runChecks = () => {
            checkWindowSize();
            checkDebugger();
            // Imprime a armadilha no console. Se o console estiver aberto, a armadilha dispara.
            console.log(consoleTrap);
            // Limpa o console para ocultar nossa armadilha da maioria dos usuários.
            setTimeout(console.clear, 100);
        };
        
        // Roda todas as verificações em um intervalo constante.
        const intervalId = setInterval(runChecks, detectionInterval);

        // --- LIMPEZA ---
        // Remove todos os listeners e intervalos quando o componente é desmontado.
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('keydown', handleKeydown);
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    return null; // Este componente não renderiza nada na tela.
};

export default AntiDevTools;
USE `blogweb`;

-- Insert enhanced sample users with better data
INSERT INTO `user` (`nome`, `sobrenome`, `email`, `senha`, `biografia`, `avatar_url`, `status`) VALUES
('Carlos', 'Silva', 'carlos@carsclub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Apaixonado por carros esportivos e modificações. Proprietário de um Mustang GT 2020 e sempre em busca de novas experiências automotivas.', '/placeholder.svg?height=100&width=100', 'active'),
('Roberto', 'Santos', 'roberto@carsclub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mecânico especialista em motores V8 com 20 anos de experiência. Trabalho com preparação de carros para competição e restauração de clássicos.', '/placeholder.svg?height=100&width=100', 'active'),
('Fernando', 'Costa', 'fernando@carsclub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Colecionador de carros clássicos americanos. Possuo uma garagem com 12 veículos restaurados, incluindo um Chevelle SS 1970 original.', '/placeholder.svg?height=100&width=100', 'active'),
('Marina', 'Oliveira', 'marina@carsclub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Piloto de drift profissional e instrutora de direção esportiva. Amo a adrenalina das pistas e compartilhar conhecimento sobre técnicas de pilotagem.', '/placeholder.svg?height=100&width=100', 'active'),
('Lucas', 'Pereira', 'lucas@carsclub.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Especialista em carros elétricos e tecnologia automotiva. Trabalho com conversões elétricas e sempre atualizado com as últimas inovações do setor.', '/placeholder.svg?height=100&width=100', 'active');

-- Insert diverse and engaging sample posts
INSERT INTO `post` (`titulo`, `corpo`, `user_id`, `status`, `views`) VALUES
('Os 10 Supercarros Mais Rápidos de 2024', 'Descubra quais são os supercarros que dominam as pistas este ano. Desde o Bugatti Chiron Super Sport 300+ até o McLaren Speedtail, exploramos velocidade, potência e design de ponta.\n\nCada um desses veículos representa o ápice da engenharia automotiva, combinando aerodinâmica avançada, materiais de alta tecnologia e motores que desafiam os limites da física.\n\nVamos analisar não apenas a velocidade máxima, mas também a aceleração, o design e as tecnologias inovadoras que fazem destes carros verdadeiras obras de arte sobre rodas.', 1, 'published', 1250),

('Guia Completo: Manutenção de Motor V8', 'Manter um motor V8 em perfeito estado requer cuidados especiais e conhecimento técnico. Neste guia completo, compartilho 20 anos de experiência como mecânico especializado.\n\n**Pontos essenciais:**\n- Troca de óleo: intervalos e tipos recomendados\n- Sistema de arrefecimento: prevenção de superaquecimento\n- Velas de ignição: quando e como trocar\n- Filtros: ar, combustível e óleo\n- Correia dentada: sinais de desgaste\n\nUm V8 bem cuidado pode durar centenas de milhares de quilômetros mantendo performance e confiabilidade. A chave está na manutenção preventiva e no uso de peças de qualidade.', 2, 'published', 890),

('Restauração Completa: Mustang Fastback 1967', 'Acompanhe o processo completo de restauração do meu Mustang Fastback 1967. Este projeto levou 18 meses e envolveu cada detalhe, desde a carroceria até o motor 289 V8 original.\n\n**Etapas do projeto:**\n1. Desmontagem completa e catalogação de peças\n2. Restauração da carroceria e pintura\n3. Reconstrução do motor 289 V8\n4. Sistema elétrico completamente novo\n5. Interior em couro original\n6. Suspensão e freios modernizados\n\nO resultado final é um carro que mantém a alma clássica mas com confiabilidade moderna. Cada parafuso foi cuidadosamente restaurado ou substituído por peças originais de época.', 3, 'published', 2100),

('Modificações que Realmente Fazem Diferença', 'Nem toda modificação vale o investimento. Depois de anos testando upgrades, aqui estão as modificações que realmente melhoram a performance do seu carro:\n\n**Top 5 modificações por custo-benefício:**\n1. **Cold Air Intake** - Melhora respiração do motor\n2. **Escapamento esportivo** - Libera potência e melhora som\n3. **Chip de potência** - Otimiza mapeamento\n4. **Suspensão esportiva** - Melhora handling\n5. **Pneus de alta performance** - Base para tudo\n\nEvite modificações apenas estéticas que não agregam performance. Invista sempre em qualidade e compatibilidade com seu projeto.', 1, 'published', 750),

('Técnicas Avançadas de Drift: Guia para Iniciantes', 'O drift é uma arte que combina técnica, feeling e muito treino. Como piloto profissional, vou compartilhar as técnicas fundamentais para quem está começando neste esporte incrível.\n\n**Fundamentos essenciais:**\n- Controle de acelerador e freio\n- Técnica do contravolante\n- Leitura da pista e pontos de entrada\n- Setup básico do carro\n- Equipamentos de segurança obrigatórios\n\n**Dica importante:** Sempre pratique em locais seguros e apropriados. O drift de rua é perigoso e ilegal. Procure pistas e eventos organizados para desenvolver suas habilidades com segurança.\n\nLembrem-se: a segurança sempre vem primeiro!', 4, 'published', 1680),

('Carros Elétricos: O Futuro já Chegou', 'A revolução elétrica está transformando a indústria automotiva. Como especialista em veículos elétricos, vou explicar por que esta tecnologia veio para ficar.\n\n**Vantagens dos carros elétricos:**\n- Torque instantâneo e aceleração impressionante\n- Manutenção reduzida (menos peças móveis)\n- Custo operacional baixo\n- Zero emissões locais\n- Tecnologia avançada de conectividade\n\n**Desafios atuais:**\n- Infraestrutura de recarga ainda em desenvolvimento\n- Autonomia limitada em alguns modelos\n- Preço inicial ainda elevado\n- Tempo de recarga vs abastecimento\n\nO Tesla Model S Plaid acelera de 0-100 km/h em apenas 2,1 segundos. Isso mostra que performance e sustentabilidade podem andar juntas!', 5, 'published', 920);

-- Insert realistic likes with timestamps
INSERT INTO `likes` (`user_id`, `post_id`, `created_at`) VALUES
(2, 1, '2024-01-15 10:30:00'), (3, 1, '2024-01-15 11:45:00'), (4, 1, '2024-01-15 14:20:00'), (5, 1, '2024-01-15 16:10:00'),
(1, 2, '2024-01-16 09:15:00'), (3, 2, '2024-01-16 13:30:00'), (4, 2, '2024-01-16 15:45:00'),
(1, 3, '2024-01-17 08:20:00'), (2, 3, '2024-01-17 12:10:00'), (4, 3, '2024-01-17 17:30:00'), (5, 3, '2024-01-17 19:45:00'),
(2, 4, '2024-01-18 11:00:00'), (3, 4, '2024-01-18 14:15:00'), (5, 4, '2024-01-18 16:30:00'),
(1, 5, '2024-01-19 10:45:00'), (2, 5, '2024-01-19 13:20:00'), (3, 5, '2024-01-19 15:10:00'),
(1, 6, '2024-01-20 09:30:00'), (2, 6, '2024-01-20 12:45:00'), (3, 6, '2024-01-20 16:20:00'), (4, 6, '2024-01-20 18:15:00');

-- Insert engaging and realistic comments
INSERT INTO `comment` (`post_id`, `user_id`, `comentario`, `status`, `data_criacao`) VALUES
(1, 2, 'Excelente lista! O Bugatti Chiron realmente é uma máquina impressionante. Tive a oportunidade de ver um de perto no Salão do Automóvel e é de tirar o fôlego.', 'approved', '2024-01-15 12:00:00'),
(1, 3, 'Faltou mencionar o Koenigsegg Jesko, que tecnicamente pode chegar a 480 km/h. Mas ótimo post, muito bem detalhado!', 'approved', '2024-01-15 15:30:00'),
(1, 4, 'Como piloto, posso dizer que velocidade máxima é uma coisa, mas o que importa mesmo é como o carro se comporta na pista. Alguns desses supercarros são verdadeiros foguetes!', 'approved', '2024-01-15 17:45:00'),

(2, 1, 'Dicas valiosas! Vou aplicar no meu Camaro SS. Principalmente sobre a troca de óleo, sempre tive dúvidas sobre os intervalos corretos.', 'approved', '2024-01-16 10:20:00'),
(2, 3, 'Roberto, você poderia fazer um post sobre preparação de V8 para competição? Tenho um projeto de drag race em mente.', 'approved', '2024-01-16 14:45:00'),
(2, 5, 'Muito bom! Mesmo sendo especialista em elétricos, ainda tenho carinho pelos V8. São motores com alma!', 'approved', '2024-01-16 18:10:00'),

(3, 1, 'Que projeto incrível! Parabéns pela dedicação. O Fastback 67 é um dos Mustangs mais bonitos já feitos. Ficou original ou fez alguma modernização?', 'approved', '2024-01-17 09:30:00'),
(3, 2, 'Fernando, como mecânico, posso dizer que você fez um trabalho impecável. A atenção aos detalhes é impressionante!', 'approved', '2024-01-17 13:45:00'),
(3, 4, 'Restauração é uma arte! Tenho um projeto similar com um Chevelle 70. Quanto tempo levou a parte da pintura?', 'approved', '2024-01-17 20:15:00'),

(4, 3, 'Concordo 100%! Muita gente gasta dinheiro em modificações que não fazem diferença real. Pneus são realmente a base de tudo.', 'approved', '2024-01-18 12:30:00'),
(4, 5, 'Ótimas dicas! Adicionaria também a importância de um bom sistema de freios, especialmente se for aumentar a potência.', 'approved', '2024-01-18 17:00:00'),

(5, 1, 'Marina, suas dicas são sempre precisas! Comecei a praticar drift há pouco tempo e seus vídeos me ajudaram muito.', 'approved', '2024-01-19 11:30:00'),
(5, 2, 'Como mecânico, sempre fico preocupado com o desgaste que o drift causa no carro. Que cuidados especiais você recomenda?', 'approved', '2024-01-19 14:45:00'),
(5, 3, 'Segurança em primeiro lugar! Muito importante essa conscientização. Drift de rua é perigoso para todos.', 'approved', '2024-01-19 16:20:00'),

(6, 1, 'Lucas, excelente análise! Estou pensando em trocar meu carro por um elétrico. O que você acha do Model 3 para uso diário?', 'approved', '2024-01-20 10:15:00'),
(6, 2, 'Como mecânico tradicional, confesso que ainda estou me adaptando aos elétricos. Mas reconheço que a tecnologia é impressionante.', 'approved', '2024-01-20 13:30:00'),
(6, 4, 'A aceleração dos carros elétricos é viciante! Já pilotei alguns e a resposta instantânea do torque é incrível.', 'approved', '2024-01-20 19:00:00');

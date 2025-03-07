//  Q-learning parameters
let training_speed = 1
// set to control the speed that the agent moves through the maze during training
let num_episodes = 20
// set to control the number of training episodes that will run
let alpha = 0.4
//  Learning rate
let gamma = 1
//  Discount factor
let epsilon_0 = 1.0
//  Initially, the Agent will always make random exploration 
let epsilon_min = 0.01
//  minimum value for epsilon; during training there is always some chance for exploration
let epsilon_decay = 0.95
//  Slower decay for more exploration
//  Settings for showing Qtables during Training
let show_Qtable_after_each_STEP = false
// set to True to see how the Qvalues are updated for each step
let show_Qtable_after_each_EPISODE = true
let show_Qtable_after_TRAINING = false
let is_paused = false
//  Define the maze on the microbit 5x5 LED array (1 = wall, 0 = open path, 2 = agent start position, 9 = goal)
let maze = [[2, 1, 0, 0, 0], [0, 1, 1, 1, 0], [0, 1, 0, 0, 0], [0, 1, 0, 1, 0], [9, 0, 0, 1, 0]]
// Goal position
let goal_rowcol = findinMaze(9)
let goal_row = goal_rowcol[0]
//  row of the goal position (0-4)
let goal_col = goal_rowcol[1]
//  column of the goal position (0-4)
// Agent starting position
let Agent_rowcol = findinMaze(2)
let Agent_row_0 = Agent_rowcol[0]
//  row of the agent starting position (0-4)
let Agent_col_0 = Agent_rowcol[1]
//  column of the agent starting position (0-4)
//  Initialize Q-table as a 5x5 grid with a single Q-value for each position in the maze
let Qtable = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]
Qtable[goal_row][goal_col] = 10
// set the reward for hitting the goal
//  Define possible moves [Up, Down, Left, Right]
let move_x = [0, 0, -1, 1]
let move_y = [-1, 1, 0, 0]
//  Show the maze once at the start
show_maze()
pause(1000)
//  Brief pause to view the maze before agent appears
led.plotBrightness(Agent_col_0, Agent_row_0, 255)
led.plotBrightness(goal_col, goal_row, 128)
//  Run multiple training episodes on button A
input.onButtonPressed(Button.A, function on_button_pressed_a() {
    let Agent_row: number;
    let Agent_col: number;
    let episode_reward: number;
    let next_Agent_col: number;
    let next_Agent_row: number;
    let next_state: number[];
    let reward: number;
    let old_Agent_col: number;
    let old_Agent_row: number;
    let old_q_value: number;
    let new_q_value: number;
    let next_max_q: number;
    let epsilon = epsilon_0
    for (let episode = 0; episode < num_episodes; episode++) {
        //  training episodes
        Agent_row = Agent_row_0
        Agent_col = Agent_col_0
        episode_reward = 0
        led.plotBrightness(Agent_col, Agent_row, 255)
        led.plotBrightness(goal_col, goal_row, 128)
        pause(100 / training_speed)
        // print("Episode " + str(episode + 1) + " Start: " + str(Agent_col) + " " + str(Agent_row) + " Goal: " + str(goal_col) + " " + str(goal_row))
        while (Agent_col != goal_col || Agent_row != goal_row) {
            next_Agent_col = 0
            // initialize the next agent position
            next_Agent_row = 0
            if (maze[Agent_row][Agent_col] == 1) {
                next_state = [old_Agent_col, old_Agent_row]
            } else if (Math.random() < epsilon) {
                // if hitting a wall force return to previous position
                next_state = get_valid_random_move(Agent_col, Agent_row)
            } else {
                next_state = get_valid_greedy_move(Agent_col, Agent_row)
            }
            
            next_Agent_col = next_state[0]
            next_Agent_row = next_state[1]
            reward = get_reward(next_Agent_col, next_Agent_row)
            // reward for next step
            episode_reward += reward
            //  episode cumulative reward
            old_Agent_col = Agent_col
            //  Store current agent position
            old_Agent_row = Agent_row
            // update Qvalue
            old_q_value = Qtable[old_Agent_row][old_Agent_col]
            if (next_Agent_col == goal_col && next_Agent_row == goal_row) {
                new_q_value = old_q_value + alpha * (reward - old_q_value)
            } else {
                //  Terminal state: no future reward
                next_max_q = max_q_value(next_Agent_col, next_Agent_row)
                new_q_value = old_q_value + alpha * (reward + gamma * next_max_q - old_q_value)
            }
            
            Qtable[old_Agent_row][old_Agent_col] = Math.round(new_q_value * 100) / 100
            if (show_Qtable_after_each_STEP == true) {
                show_Qtable()
                
                is_paused = true
            }
            
            while (is_paused == true) {
                pause(1000)
            }
            update_agent_position(old_Agent_col, old_Agent_row, next_Agent_col, next_Agent_row)
            Agent_col = next_Agent_col
            Agent_row = next_Agent_row
        }
        console.log("Episode: " + ("" + (episode + 1)) + "   Epsilon= " + ("" + Math.round(epsilon * 1000) / 1000) + "   Reward= " + ("" + episode_reward))
        if (show_Qtable_after_each_EPISODE == true) {
            show_Qtable()
        }
        
        epsilon = Math.max(epsilon * epsilon_decay, epsilon_min)
    }
    //  decay epsilon for next episode
    console.log("Training Complete")
    led.plotBrightness(goal_col, goal_row, 128)
    if (show_Qtable_after_TRAINING == true) {
        show_Qtable()
    }
    
})
//  Function to get a valid random move (allows walls)
function get_valid_random_move(Agent_col: number, Agent_row: number): number[] {
    let proposed_x: number;
    let proposed_y: number;
    let attempts = 0
    let i = 0
    let next_state = [0, 0]
    while (true) {
        i = randint(0, 3)
        proposed_x = Agent_col + move_x[i]
        proposed_y = Agent_row + move_y[i]
        if (0 <= proposed_x && proposed_x <= 4 && (0 <= proposed_y && proposed_y <= 4)) {
            next_state[0] = proposed_x
            next_state[1] = proposed_y
            return next_state
        }
        
        // print(i + ": Random move rejected: [" + str(Agent_col) + "][" + str(Agent_row) + "] to [" + str(proposed_x) + "][" + str(proposed_y) + "]")
        attempts += 1
    }
}

//  Fallback: return a valid move if all attempts fail
//  Function to get a valid greedy move (allows walls)
function get_valid_greedy_move(Agent_col: number, Agent_row: number): number[] {
    let proposed_Agent_col: number;
    let proposed_Agent_row: number;
    let q: number;
    let best_q = -9999
    let next_Agent_col = 0
    //  initialize the next agent position
    let next_Agent_row = 0
    let valid_found = false
    let next_state = [0, 0]
    for (let i = 0; i < 4; i++) {
        proposed_Agent_col = Agent_col + move_x[i]
        proposed_Agent_row = Agent_row + move_y[i]
        if (0 <= proposed_Agent_col && proposed_Agent_col <= 4 && (0 <= proposed_Agent_row && proposed_Agent_row <= 4)) {
            q = Qtable[proposed_Agent_row][proposed_Agent_col]
            if (q > best_q) {
                best_q = q
                next_state[0] = proposed_Agent_col
                next_state[1] = proposed_Agent_row
                valid_found = true
            }
            
        }
        
    }
    return next_state
}

//  On button B run the optimal path
input.onButtonPressed(Button.B, function on_button_pressed_b() {
    let old_x: number;
    let old_y: number;
    let next_state: number[];
    let next_Agent_col: number;
    let next_Agent_row: number;
    let reward: number;
    let Agent_col = Agent_col_0
    let Agent_row = Agent_row_0
    let episode_reward = 0
    led.plotBrightness(Agent_col, Agent_row, 255)
    pause(500)
    let steps = 0
    while (Agent_col != goal_col || Agent_row != goal_row) {
        old_x = Agent_col
        //  Store current position
        old_y = Agent_row
        next_state = get_valid_greedy_move(Agent_col, Agent_row)
        next_Agent_col = next_state[0]
        next_Agent_row = next_state[1]
        reward = get_reward(next_Agent_col, next_Agent_row)
        episode_reward += reward
        // count the total reward for the intelligent run
        update_agent_position(old_x, old_y, next_Agent_col, next_Agent_row)
        pause(500)
        Agent_col = next_Agent_col
        Agent_row = next_Agent_row
        steps += 1
    }
    // count the steps taken for intelligent run
    console.log("Intelligent run complete in " + ("" + steps) + " steps. Reward = " + ("" + episode_reward))
})
//  Function to update the agent's position
function update_agent_position(old_x: number, old_y: number, new_x: number, new_y: number) {
    if (maze[old_y][old_x] == 1) {
        led.plotBrightness(old_x, old_y, 5)
    } else {
        led.unplot(old_x, old_y)
    }
    
    led.plotBrightness(new_x, new_y, 255)
    if (maze[new_y][new_x] == 1) {
        play_noise()
    }
    
    pause(500 / training_speed)
    //  Brief delay to make movement visible
    if (new_x == goal_col && new_y == goal_row) {
        play_ding()
        for (let i = 0; i < 6; i++) {
            led.toggle(goal_col, goal_row)
            pause(500 / training_speed)
        }
    }
    
}

//  Get reward of the next move
function get_reward(new_x: number, new_y: number): number {
    let reward: number;
    if (new_x == goal_col && new_y == goal_row) {
        reward = 10
    } else if (maze[new_y][new_x] == 1) {
        reward = -10
    } else {
        reward = -1
    }
    
    return reward
}

//  Get maximum Q-value from next state's possible actions
function max_q_value(Agent_col: number, Agent_row: number): number {
    let nx: number;
    let ny: number;
    let q: number;
    let max_q = -1000
    for (let i = 0; i < 4; i++) {
        nx = Agent_col + move_x[i]
        ny = Agent_row + move_y[i]
        if (0 <= nx && nx <= 4 && (0 <= ny && ny <= 4)) {
            q = Qtable[ny][nx]
            if (q > max_q) {
                max_q = q
            }
            
        }
        
    }
    return max_q
}

//  Function to display the static maze (called once)
function show_maze() {
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            if (maze[y][x] == 1) {
                led.plotBrightness(x, y, 5)
            }
            
        }
    }
}

function play_ding() {
    music.play(music.createSoundExpression(WaveShape.Sine, 2469, 2996, 98, 0, 500, SoundExpressionEffect.None, InterpolationCurve.Logarithmic), music.PlaybackMode.UntilDone)
}

function play_noise() {
    music.play(music.createSoundExpression(WaveShape.Noise, 2526, 2351, 50, 50, 10, SoundExpressionEffect.Warble, InterpolationCurve.Linear), music.PlaybackMode.UntilDone)
}

function format_number(num: number) {
    let num_str = "" + num
    if (num_str.indexOf(".") < 0) {
        num_str += "."
    }
    
    //  Add "." if no decimal
    let parts = _py.py_string_split(num_str, ".")
    let int_part = "      " + parts[0]
    // pad with leading whitespace
    int_part = int_part.slice(-4)
    // limit to 4 places left
    let frac_part = parts[1] + "00"
    //  pad with trailing 0s
    frac_part = frac_part.slice(0, 2)
    // limit to 2 decimal places right
    return int_part + "." + frac_part
}

//  recombine number string
//  Function to display the Q-table with aligned formatting
function show_Qtable() {
    let row_str: string;
    let num_str: any;
    console.log("Q-Table:")
    for (let row of Qtable) {
        row_str = "["
        for (let i = 0; i < 5; i++) {
            num_str = format_number(row[i])
            row_str += num_str
            if (i < 4) {
                row_str += ","
            }
            
        }
        //  Add comma and space
        row_str += "]"
        console.log(row_str)
    }
}

input.onLogoEvent(TouchButtonEvent.Pressed, function on_logo_pressed() {
    if (show_Qtable_after_each_STEP == true) {
        
        is_paused = false
    } else {
        
        training_speed = training_speed * 2
    }
    
})
function findinMaze(num: number): number[] {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (maze[i][j] == num) {
                return [i, j]
            }
            
        }
    }
    return []
}


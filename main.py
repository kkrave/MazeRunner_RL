from microbit import *
import music
    
# Q-learning parameters
training_speed = 1   #set to control the speed that the agent moves through the maze during training
num_episodes = 20    #set to control the number of training episodes that will run
alpha = 0.4  # Learning rate
gamma = 1  # Discount factor
epsilon_0 = 1.0  # Initially, the Agent will always make random exploration 
epsilon_min = 0.01  # minimum value for epsilon; during training there is always some chance for exploration
epsilon_decay = 0.95  # Slower decay for more exploration

# Settings for showing Qtables during Training
show_Qtable_after_each_STEP = False   #set to True to see how the Qvalues are updated for each step
show_Qtable_after_each_EPISODE = True
show_Qtable_after_TRAINING = False
is_paused = False

# Define the maze on the microbit 5x5 LED array (1 = wall, 0 = open path, 2 = agent start position, 9 = goal)
maze = [
    [2, 1, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [9, 0, 0, 1, 0]
]

#Goal position
goal_rowcol = findinMaze(9)
goal_row = goal_rowcol[0]   # row of the goal position (0-4)
goal_col = goal_rowcol[1]  # column of the goal position (0-4)

#Agent starting position
Agent_rowcol = findinMaze(2)
Agent_row_0 = Agent_rowcol[0]  # row of the agent starting position (0-4)
Agent_col_0 = Agent_rowcol[1] # column of the agent starting position (0-4)

# Initialize Q-table as a 5x5 grid with a single Q-value for each position in the maze
Qtable = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
]
Qtable[goal_row][goal_col] = 10   #set the reward for hitting the goal

# Define possible moves [Up, Down, Left, Right]
move_x = [0, 0, -1, 1]
move_y = [-1, 1, 0, 0]

# Show the maze once at the start
show_maze()
pause(1000)  # Brief pause to view the maze before agent appears
led.plot_brightness(Agent_col_0, Agent_row_0, 255)
led.plot_brightness(goal_col, goal_row, 128)

# Run multiple training episodes on button A
def on_button_pressed_a():
    epsilon = epsilon_0
    
    for episode in range(num_episodes):  # training episodes
        Agent_row = Agent_row_0
        Agent_col = Agent_col_0
        episode_reward = 0
    
        led.plot_brightness(Agent_col, Agent_row, 255)
        led.plot_brightness(goal_col, goal_row, 128)
        pause(100/training_speed)
        #print("Episode " + str(episode + 1) + " Start: " + str(Agent_col) + " " + str(Agent_row) + " Goal: " + str(goal_col) + " " + str(goal_row))
    
        while (Agent_col != goal_col or Agent_row != goal_row):
            next_Agent_col = 0  #initialize the next agent position
            next_Agent_row = 0
            
            if maze[Agent_row][Agent_col] == 1:
                next_state = [old_Agent_col, old_Agent_row]  #if hitting a wall force return to previous position
            elif Math.random() < epsilon:
                next_state = get_valid_random_move(Agent_col, Agent_row)
            else:
                next_state = get_valid_greedy_move(Agent_col, Agent_row)
            next_Agent_col = next_state[0]
            next_Agent_row = next_state[1]
            
            reward = get_reward(next_Agent_col, next_Agent_row) #reward for next step
            episode_reward += reward   # episode cumulative reward

            old_Agent_col = Agent_col  # Store current agent position
            old_Agent_row = Agent_row

            #update Qvalue
            old_q_value = Qtable[old_Agent_row][old_Agent_col]
            if next_Agent_col == goal_col and next_Agent_row == goal_row:
                new_q_value = old_q_value + alpha * (reward - old_q_value)  # Terminal state: no future reward
            else:
                next_max_q = max_q_value(next_Agent_col, next_Agent_row)
                new_q_value = old_q_value + alpha * (reward + gamma * next_max_q - old_q_value)
            Qtable[old_Agent_row][old_Agent_col] = Math.round(new_q_value * 100) / 100
            if show_Qtable_after_each_STEP == True:
                show_Qtable()
                global is_paused
                is_paused = True
            while is_paused == True:
                pause(1000)
            update_agent_position(old_Agent_col, old_Agent_row, next_Agent_col, next_Agent_row)
            Agent_col = next_Agent_col
            Agent_row = next_Agent_row

        print("Episode: " + str(episode + 1) + "   Epsilon= " + str(Math.round(epsilon * 1000) / 1000) + "   Reward= " + str(episode_reward))
        if show_Qtable_after_each_EPISODE == True:
            show_Qtable()
        epsilon = max(epsilon * epsilon_decay, epsilon_min)  # decay epsilon for next episode
        
    print("Training Complete")
    led.plot_brightness(goal_col, goal_row, 128)
    if show_Qtable_after_TRAINING == True:
            show_Qtable()
input.on_button_pressed(Button.A, on_button_pressed_a)

# Function to get a valid random move (allows walls)
def get_valid_random_move(Agent_col, Agent_row):
    attempts = 0
    i = 0
    next_state = [0,0]
    while True:
        i = randint(0, 3)
        proposed_x = Agent_col + move_x[i]
        proposed_y = Agent_row + move_y[i]
        if (0 <= proposed_x <= 4 and 0 <= proposed_y <= 4):
            next_state[0] = proposed_x
            next_state[1] = proposed_y
            return next_state
        #print(i + ": Random move rejected: [" + str(Agent_col) + "][" + str(Agent_row) + "] to [" + str(proposed_x) + "][" + str(proposed_y) + "]")
        attempts += 1
    # Fallback: return a valid move if all attempts fail

# Function to get a valid greedy move (allows walls)
def get_valid_greedy_move(Agent_col, Agent_row):
    best_q = -9999
    next_Agent_col = 0  # initialize the next agent position
    next_Agent_row = 0
    valid_found = False
    next_state = [0,0]
    for i in range(4):
        proposed_Agent_col = Agent_col + move_x[i]
        proposed_Agent_row = Agent_row + move_y[i]
        if 0 <= proposed_Agent_col <= 4 and 0 <= proposed_Agent_row <= 4:
            q = Qtable[proposed_Agent_row][proposed_Agent_col]
            if q > best_q:
                best_q = q
                next_state[0] = proposed_Agent_col
                next_state[1] = proposed_Agent_row
                valid_found = True
    return next_state

# On button B run the optimal path
def on_button_pressed_b():
    Agent_col = Agent_col_0
    Agent_row = Agent_row_0
    episode_reward = 0
    led.plot_brightness(Agent_col, Agent_row, 255)
    pause(500)
    steps = 0
    while (Agent_col != goal_col or Agent_row != goal_row):
        old_x = Agent_col # Store current position
        old_y = Agent_row
        next_state = get_valid_greedy_move(Agent_col, Agent_row)
        next_Agent_col = next_state[0]
        next_Agent_row = next_state[1]
        reward = get_reward(next_Agent_col, next_Agent_row)
        episode_reward += reward  #count the total reward for the intelligent run
        update_agent_position(old_x, old_y, next_Agent_col, next_Agent_row)
        pause(500)
        Agent_col = next_Agent_col
        Agent_row = next_Agent_row
        steps += 1  #count the steps taken for intelligent run
    
    print("Intelligent run complete in " + str(steps) + " steps. Reward = " + str(episode_reward))

input.on_button_pressed(Button.B, on_button_pressed_b)

# Function to update the agent's position
def update_agent_position(old_x, old_y, new_x, new_y):
    if maze[old_y][old_x] == 1:
        led.plot_brightness(old_x, old_y, 5)
    else:
        led.unplot(old_x, old_y)
    led.plot_brightness(new_x, new_y, 255)
    if (maze[new_y][new_x] == 1):
        play_noise()
    pause(500/training_speed)  # Brief delay to make movement visible
    if (new_x == goal_col and new_y == goal_row):
        play_ding()
        for i in range(6):
            led.toggle(goal_col, goal_row)
            pause(500/training_speed)
    

# Get reward of the next move
def get_reward(new_x, new_y):
    if (new_x == goal_col and new_y == goal_row):
        reward = 10
    elif maze[new_y][new_x] == 1:
        reward = -10
    else:
        reward = -1
    return reward

# Get maximum Q-value from next state's possible actions
def max_q_value(Agent_col, Agent_row):
    max_q = -1000
    for i in range(4):
        nx = Agent_col + move_x[i]
        ny = Agent_row + move_y[i]
        if 0 <= nx <= 4 and 0 <= ny <= 4:
            q = Qtable[ny][nx]
            if q > max_q:
                max_q = q
    return max_q

# Function to display the static maze (called once)
def show_maze():
    for y in range(5):
        for x in range(5):
            if maze[y][x] == 1:
                led.plot_brightness(x, y, 5)

def play_ding():
    music.play(music.create_sound_expression(WaveShape.SINE,
            2469, 2996, 98, 0, 500,
            SoundExpressionEffect.NONE,
            InterpolationCurve.LOGARITHMIC),
        music.PlaybackMode.UNTIL_DONE)
def play_noise():
    music.play(music.create_sound_expression(WaveShape.NOISE,
            2526, 2351, 50, 50, 10,
            SoundExpressionEffect.WARBLE,
            InterpolationCurve.LINEAR),
        music.PlaybackMode.UNTIL_DONE)

def format_number(num):
    num_str = str(num)
    if "." not in num_str:
        num_str += "."  # Add "." if no decimal
    parts = num_str.split(".")
    int_part = "      " + parts[0] #pad with leading whitespace
    int_part = int_part[-4:] #limit to 4 places left
    frac_part = parts[1] + "00" # pad with trailing 0s
    frac_part = frac_part[:2] #limit to 2 decimal places right
    return int_part + "." + frac_part  # recombine number string

# Function to display the Q-table with aligned formatting
def show_Qtable():
    print("Q-Table:")
    for row in Qtable:
        row_str = "["
        for i in range(5):
            num_str = format_number(row[i])
            row_str += num_str
            if i < 4:
                row_str += ","  # Add comma and space
        row_str += "]"
        print(row_str)

def on_logo_pressed():
    if show_Qtable_after_each_STEP == True:
        global is_paused
        is_paused = False
    else:
        global training_speed
        training_speed = training_speed*2
input.on_logo_event(TouchButtonEvent.PRESSED, on_logo_pressed)

def findinMaze(num):
    for i in range(5):
        for j in range(5):
            if maze[i][j] == num:
                return (i, j)
    return ()
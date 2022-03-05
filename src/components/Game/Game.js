import { useState, useEffect } from "react";
import { Text, View, ScrollView, Alert, ActivityIndicator } from "react-native";
import Keyboard from "../Keyboard";
import { colors, CLEAR, ENTER, colorsToEmoji } from "../../constants";
import { words } from "../words";
import styles from "./Game.styles";
import { getDayOfTheYear, copyArray, getDayKey } from "../../utils";
import { AsyncStorage } from "@react-native-async-storage/async-storage";
import EndScreen from "../EndScreen";

const NUMBER_OF_TRIES = 6;

const dayOfTheYear = getDayOfTheYear();
const dayKey = getDayKey();

const game = {
  day_15: {
    rows: [[], []],
    curRow: 4,
    curCol: 2,
    gameState: "won",
  },
  day_16: {
    rows: [[], []],
    curRow: 4,
    curCol: 2,
    gameState: "won",
  },
  day_17: {
    rows: [[], []],
    curRow: 4,
    curCol: 2,
    gameState: "won",
  },
};

const Game = () => {
  const word = words[dayOfTheYear];
  const letters = word.split(""); // ['h', 'e',...]

  const [rows, setRows] = useState(
    new Array(NUMBER_OF_TRIES).fill(new Array(letters.length).fill(""))
  );

  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [gameState, setGameState] = useState("playing");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (curRow > 0) {
      checkGameState();
    }
  }, [curRow]);

  useEffect(() => {
    if (loaded) {
      persistState();
    }
  }, [rows, curRow, curCol, gameState]);

  useEffect(() => {
    readState();
  }, []);

  const persistState = async () => {
    // write all the state variables in Async Storage

    const dataForToday = {
      rows,
      curRow,
      curCol,
      gameState,
    };
    try {
      const existingStateString = await AsyncStorage.getItem("@game");
      const existingState = existingStateString
        ? JSON.parse(existingStateString)
        : {};

      existingState[dayKey] = dataForToday;

      const dataString = JSON.stringify(existingState);
      await AsyncStorage.setItem("@game", dataString);
    } catch (error) {
      console.log("Failed to write data to Async Storage");
    }
  };

  const readState = async () => {
    const dataString = await AsyncStorage.getItem("@game");
    try {
      const data = JSON.parse(dataString);
      const day = data[dayKey];
      setRows(data.rows);
      setCurCol(data.curCol);
      setCurRow(data.curRow);
      setGameState(data.gameState);
    } catch (error) {
      console.log("Couldn't parse state");
    }

    setLoaded(true);
  };

  const checkGameState = () => {
    if (checkIfWon() && gameState !== "won") {
      Alert.alert("You won!", "You won!");
      setGameState("won");
    } else if (checkIfLost() && gameState !== "lost") {
      Alert.alert("You lost", "Try again tomorrow!");
      setGameState("lost");
    }
  };

  const checkIfWon = () => {
    const row = rows[curRow - 1];

    return row.every((letter, i) => letter === letters[i]);
  };

  const checkIfLost = () => {
    return checkIfWon() && curRow === rows.length;
  };

  const onKeyPressed = (key) => {
    if (gameState !== "playing") {
      return;
    }

    const updatedRows = copyArray(rows);

    if (key == CLEAR) {
      const prevCol = curCol - 1;
      if (prevCol >= 0) {
        updatedRows[curRow][prevCol] = "";
        setRows(updatedRows);
        setCurCol(prevCol);
      }

      return;
    }

    if (key === ENTER) {
      if (curCol === rows[0].length) {
        setCurRow(curRow + 1);
        setCurCol(0);
      }

      return;
    }

    if (curCol < rows[0].length) {
      updatedRows[curRow][curCol] = key;
      setRows(updatedRows);
      setCurCol(curCol + 1);
    }
  };

  const isCellActive = (row, col) => {
    return row === curRow && col === curCol;
  };

  const getCellBGColor = (row, col) => {
    const letter = rows[row][col];
    if (row >= curRow) {
      return colors.black;
    }
    if (letter === letters[col]) {
      return colors.primary;
    }
    if (letters.includes(letter)) {
      return colors.secondary;
    }
    return colors.darkgrey;
  };

  const getAllLettersWithColor = (color) => {
    return rows.flatMap((row, i) =>
      row.filter((cell, j) => getCellBGColor(i, j) === color)
    );
  };

  const greenCaps = getAllLettersWithColor(colors.primary);
  const yellowCaps = getAllLettersWithColor(colors.secondary);
  const greyCaps = getAllLettersWithColor(colors.darkgrey);

  // if (!loaded) {
  //   return <ActivityIndicator />;
  // }

  if (gameState !== "playing") {
    return (
      <EndScreen
        won={gameState === "won"}
        rows={rows}
        getCellBGColor={getCellBGColor}
      />
    );
  }

  return (
    <>
      <ScrollView style={styles.map}>
        {rows.map((row, i) => (
          <View key={`row-${i}`} style={styles.row}>
            {row.map((letter, j) => (
              <View
                key={`cell-${i}-${j}`}
                style={[
                  styles.cell,
                  {
                    borderColor: isCellActive(i, j)
                      ? colors.grey
                      : colors.darkgrey,
                    backgroundColor: getCellBGColor(i, j),
                  },
                ]}
              >
                <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        ))}

        <Keyboard
          onKeyPressed={onKeyPressed}
          greenCaps={greenCaps}
          yellowCaps={yellowCaps}
          greyCaps={greyCaps}
        />
      </ScrollView>
    </>
  );
};

export default Game;

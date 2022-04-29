# PageDOM

A JavaScript library for simple working with a XML data via XPath query.

## Methods

| Method                                                           | Description                                                                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| xpathQuery(*xpath*, *root*)                                      | *xpath*<br/>*root* (optional)<br/><br/>Returns array of objects                                                                        |
| findSingleNode(*xpath*, *root*, *allowEmpty*, *regexp*, *clean*) | *xpath*<br/>*root* (optional)<br/>*allowEmpty* (optional)<br/>*regexp* (optional)<br/>*clean* (optional)<br/><br/>Returns string\|null |
| findNodes(*xpath*, *root*, *regexp*, *clean*)                    | *xpath*<br/>*root* (optional)<br/>*regexp* (optional)<br/>*clean* (optional)<br/><br/>Returns array of string\|null                    |

## Properties

| Property | Description                       |
| -------- | --------------------------------- |
| version  | Returns information about version |
